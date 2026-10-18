-- Trainer override and direct placement migration.
-- Follows docs/SCHEMA.md section 4 and docs/RLS_RULEs.md section 4.
--
-- override_decision(): trainers and school admins can override a hiring
--   decision. Stores overridden_by and override_reason, writes audit_log.
-- place_intern(): trainers and school admins can directly place an intern
--   into a company. Creates a company_members row, notes it on the record,
--   writes audit_log.

-- ============================================================================
-- override_decision() function
-- ============================================================================

create function private.override_decision(
  p_application_id uuid,
  p_override_reason text,
  p_actor_id uuid
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
  v_current_overridden_by uuid;
begin
  -- Get application's organization and current status
  select organization_id, status, overridden_by
  into v_organization_id, v_application_status, v_current_overridden_by
  from applications
  where id = p_application_id;

  if v_application_status is null then
    raise exception 'Application not found';
  end if;

  -- Verify actor is trainer or school admin of the organisation
  if not private.has_role('trainer') and not private.has_role('school_admin') then
    raise exception 'Only trainers and school admins can override decisions';
  end if;

  -- Verify actor belongs to the same organisation
  -- (current_org_id() returns the caller's org from user_roles)
  if private.current_org_id() is distinct from v_organization_id then
    raise exception 'Actor is not a member of this organisation';
  end if;

  -- Update the application with override info
  update applications
  set overridden_by = p_actor_id,
      override_reason = p_override_reason,
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
    p_actor_id,
    'override_decision',
    'applications',
    p_application_id,
    jsonb_build_object(
      'application_id', p_application_id,
      'previous_status', v_application_status,
      'override_reason', p_override_reason,
      'overridden_by', p_actor_id,
      'previously_overridden_by', v_current_overridden_by
    ),
    now()
  );

end;
$$;

-- Grant execute to authenticated so server actions can call it
grant execute on function private.override_decision(
  uuid, text, uuid
) to authenticated;

-- ============================================================================
-- place_intern() function
-- ============================================================================

create function private.place_intern(
  p_application_id uuid,
  p_actor_id uuid
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
  v_applicant_id uuid;
  v_cohort_id uuid;
  v_company_id uuid;
  v_existing_member uuid;
begin
  -- Get application details
  select a.organization_id, a.status, a.applicant_id, a.cohort_id,
         (select company_id from job_postings where id = a.job_posting_id)
  into v_organization_id, v_application_status, v_applicant_id, v_cohort_id, v_company_id
  from applications a
  where id = p_application_id;

  if v_application_status is null then
    raise exception 'Application not found';
  end if;

  -- Verify actor is trainer or school admin of the organisation
  if not private.has_role('trainer') and not private.has_role('school_admin') then
    raise exception 'Only trainers and school admins can place interns';
  end if;

  -- Verify actor belongs to the same organisation
  if private.current_org_id() is distinct from v_organization_id then
    raise exception 'Actor is not a member of this organisation';
  end if;

  -- Verify the application has been offered (or overridden)
  if v_application_status not in ('offered', 'accepted', 'rejected') then
    raise exception 'Application is not in a placeable state';
  end if;

  -- Check if already a company member
  select id into v_existing_member
  from company_members
  where profile_id = v_applicant_id
    and company_id = v_company_id
    and ended_at is null;

  if v_existing_member is not null then
    raise exception 'Intern is already a member of this company';
  end if;

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

  -- Write to audit log noting direct placement
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
    p_actor_id,
    'place_intern',
    'company_members',
    null,
    jsonb_build_object(
      'application_id', p_application_id,
      'applicant_id', v_applicant_id,
      'company_id', v_company_id,
      'placement_type', 'direct'
    ),
    now()
  );

end;
$$;

-- Grant execute to authenticated so server actions can call it
grant execute on function private.place_intern(
  uuid, uuid
) to authenticated;
