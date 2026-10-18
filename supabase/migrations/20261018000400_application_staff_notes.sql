-- Application staff notes migration.
-- Follows docs/SCHEMA.md section 4 and docs/RLS_RULEs.md section 4.
--
-- Private staff notes and scores live here so applicants cannot read them.
-- Public feedback_to_applicant stays on the applications table.

-- ============================================================================
-- application_staff_notes table
-- ============================================================================

create table application_staff_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  application_id uuid not null references applications(id),
  author_id uuid not null references profiles(id),
  note text not null,
  is_private boolean not null default true,
  score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_application_staff_notes_organization_id
  on application_staff_notes(organization_id);
create index idx_application_staff_notes_application_id
  on application_staff_notes(application_id);
create index idx_application_staff_notes_author_id
  on application_staff_notes(author_id);

-- ============================================================================
-- updated_at trigger
-- ============================================================================

create trigger application_staff_notes_updated_at
  before update on application_staff_notes
  for each row
  execute function private_set_updated_at();

-- ============================================================================
-- RLS policies
-- Select: Staff only (HR/manager of company, trainers)
-- Insert: HR or manager (D); trainer (E)
-- Update: The author; trainer (E)
-- Delete: none
-- ============================================================================

alter table application_staff_notes enable row level security;

create policy "application_staff_notes_select" on public.application_staff_notes
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.company_function_of(
      (select company_id from applications where id = application_id)
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from applications where id = application_id)
    )
    or private.has_role('school_admin')
  )
);

create policy "application_staff_notes_insert" on public.application_staff_notes
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and author_id = (select auth.uid())
  and (
    private.company_function_of(
      (select company_id from applications where id = application_id)
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from applications where id = application_id)
    )
  )
);

create policy "application_staff_notes_update" on public.application_staff_notes
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    author_id = (select auth.uid())
    or private.company_function_of(
      (select company_id from applications where id = application_id)
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from applications where id = application_id)
    )
    or private.has_role('school_admin')
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    author_id = (select auth.uid())
    or private.company_function_of(
      (select company_id from applications where id = application_id)
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from applications where id = application_id)
    )
    or private.has_role('school_admin')
  )
);

-- No delete policy

-- ============================================================================
-- advance_application() function
-- Changes application status through a single function call.
-- Writes to audit_log. Called by HR, manager, or trainer.
-- ============================================================================

create function private.advance_application(
  p_application_id uuid,
  p_new_status application_status,
  p_feedback_to_applicant text,
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
  v_application_status application_status;
begin
  -- Get the application's organization
  select organization_id, status
  into v_organization_id, v_application_status
  from applications
  where id = p_application_id;

  if v_application_status is null then
    raise exception 'Application not found';
  end if;

  -- Update the application status and feedback
  update applications
  set status = p_new_status,
      feedback_to_applicant = p_feedback_to_applicant,
      decided_by = p_actor_id,
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
    p_actor_id,
    'advance_application',
    'applications',
    p_application_id,
    jsonb_build_object(
      'previous_status', v_application_status,
      'new_status', p_new_status,
      'feedback_to_applicant', p_feedback_to_applicant
    ),
    now()
  );

end;
$$;

-- Grant execute to authenticated so server actions can call it
grant execute on function private.advance_application(
  uuid, application_status, text, uuid
) to authenticated;

-- ============================================================================
-- Grant SELECT on application_staff_notes to anon (RLS returns zero rows)
-- ============================================================================

grant select on public.application_staff_notes to anon;
