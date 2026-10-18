-- Offers migration.
-- Follows docs/SCHEMA.md section 4 and docs/RLS_RULEs.md section 4.
--
-- An accepted offer creates a company_members row.

-- ============================================================================
-- offers table
-- ============================================================================

create table offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  application_id uuid not null references applications(id) unique,
  offered_by uuid not null references profiles(id),
  offered_at timestamptz not null default now(),
  response text not null default 'pending' check (response in ('pending', 'accepted', 'declined')),
  responded_at timestamptz
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_offers_organization_id on offers(organization_id);
create index idx_offers_application_id on offers(application_id);
create index idx_offers_response on offers(response);

-- ============================================================================
-- RLS policies for offers
-- Select: The applicant, staff, school admin (F)
-- Insert: HR or manager (D); trainer (E)
-- Update: The applicant may only respond through accept_offer() function
-- Delete: none
-- ============================================================================

alter table offers enable row level security;

create policy "offers_select" on public.offers
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    (select applicant_id from applications where id = application_id) = (select auth.uid())
    or private.company_function_of(
      (select company_id from job_postings where id = (select job_posting_id from applications where id = application_id))
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from applications where id = application_id)
    )
    or private.has_role('school_admin')
  )
);

create policy "offers_insert" on public.offers
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and offered_by = (select auth.uid())
  and (
    private.company_function_of(
      (select company_id from job_postings where id = (select job_posting_id from applications where id = application_id))
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from applications where id = application_id)
    )
  )
);

create policy "offers_update" on public.offers
for update to authenticated
using (
  organization_id = (select private.current_org_id())
)
with check (
  organization_id = (select private.current_org_id())
  and (
    -- Only the applicant can change response (through accept_offer function)
    (select applicant_id from applications where id = application_id) = (select auth.uid())
    or private.is_trainer_of(
      (select cohort_id from applications where id = application_id)
    )
    or private.has_role('school_admin')
  )
);

-- No delete policy

-- ============================================================================
-- make_offer() function
-- HR, manager, or trainer makes an offer for an application.
-- Sets application status to 'offered'.
-- ============================================================================

create function private.make_offer(
  p_application_id uuid,
  p_offered_by uuid
)
returns void
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_organization_id uuid;
  v_application_status text;
begin
  -- Get application's organization and current status
  select organization_id, status
  into v_organization_id, v_application_status
  from applications
  where id = p_application_id;

  if v_application_status is null then
    raise exception 'Application not found';
  end if;

  if v_application_status not in ('submitted', 'screening', 'interview') then
    raise exception 'Application is not in an offerable state';
  end if;

  -- Create the offer
  insert into public.offers (
    organization_id,
    application_id,
    offered_by,
    offered_at,
    response
  ) values (
    v_organization_id,
    p_application_id,
    p_offered_by,
    now(),
    'pending'
  );

  -- Update application status to 'offered'
  update applications
  set status = 'offered',
      decided_by = p_offered_by,
      decided_at = now(),
      updated_at = now()
  where id = p_application_id;

  -- Write to audit log
  insert into public.audit_log (
    organization_id,
    actor_id,
    action,
    table_name,
    record_id,
    details,
    created_at
  ) values (
    v_organization_id,
    p_offered_by,
    'make_offer',
    'offers',
    p_application_id,
    jsonb_build_object(
      'application_id', p_application_id,
      'offered_by', p_offered_by
    ),
    now()
  );

end;
$$;

-- Grant execute to authenticated so server actions can call it
grant execute on function private.make_offer(
  uuid, uuid
) to authenticated;

-- ============================================================================
-- accept_offer() function
-- Intern accepts or declines an offer.
-- Accepting creates a company_members row.
-- ============================================================================

create function private.accept_offer(
  p_offer_id uuid,
  p_response text
)
returns void
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_application_id uuid;
  v_applicant_id uuid;
  v_organization_id uuid;
  v_cohort_id uuid;
  v_company_id uuid;
  v_offer_response text;
begin
  -- Get offer details
  select o.application_id, o.organization_id, o.response
  into v_application_id, v_organization_id, v_offer_response
  from offers o
  where id = p_offer_id;

  if v_application_id is null then
    raise exception 'Offer not found';
  end if;

  if v_offer_response <> 'pending' then
    raise exception 'Offer already responded to';
  end if;

  -- Get applicant and company details
  select a.applicant_id, a.cohort_id,
         (select company_id from job_postings where id = a.job_posting_id)
  into v_applicant_id, v_cohort_id, v_company_id
  from applications a
  where a.id = v_application_id;

  -- Update the offer response
  update offers
  set response = p_response,
      responded_at = now()
  where id = p_offer_id;

  -- Update application status
  if p_response = 'accepted' then
    update applications
    set status = 'accepted',
        decided_by = v_applicant_id,
        decided_at = now(),
        updated_at = now()
    where id = v_application_id;

    -- Create company_members row
    insert into public.company_members (
      organization_id,
      cohort_id,
      company_id,
      profile_id,
      function,
      title,
      is_standin,
      started_at
    ) values (
      v_organization_id,
      v_cohort_id,
      v_company_id,
      v_applicant_id,
      'intern',
      null,
      false,
      now()
    );

    -- Write to audit log
    insert into public.audit_log (
      organization_id,
      actor_id,
      action,
      table_name,
      record_id,
      details,
      created_at
    ) values (
      v_organization_id,
      v_applicant_id,
      'accept_offer',
      'company_members',
      null,
      jsonb_build_object(
        'application_id', v_application_id,
        'offer_id', p_offer_id,
        'company_id', v_company_id,
        'profile_id', v_applicant_id
      ),
      now()
    );
  else
    -- Declined
    update applications
    set status = 'rejected',
        decided_by = v_applicant_id,
        decided_at = now(),
        updated_at = now()
    where id = v_application_id;

    -- Write to audit log
    insert into public.audit_log (
      organization_id,
      actor_id,
      action,
      table_name,
      record_id,
      details,
      created_at
    ) values (
      v_organization_id,
      v_applicant_id,
      'decline_offer',
      'offers',
      p_offer_id,
      jsonb_build_object(
        'application_id', v_application_id,
        'offer_id', p_offer_id
      ),
      now()
    );
  end if;

end;
$$;

-- Grant execute to authenticated so server actions can call it
grant execute on function private.accept_offer(
  uuid, text
) to authenticated;

-- ============================================================================
-- Grant SELECT on offers to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.offers to anon;
