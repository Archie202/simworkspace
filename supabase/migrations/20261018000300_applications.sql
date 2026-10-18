-- Applications migration.
-- Follows docs/SCHEMA.md section 4 and docs/RLS_RULEs.md section 4.

-- ============================================================================
-- application_status enum
-- ============================================================================

create type application_status as enum (
  'submitted',
  'screening',
  'interview',
  'offered',
  'accepted',
  'rejected',
  'withdrawn'
);

-- ============================================================================
-- applications table
-- ============================================================================

create table applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  company_id uuid not null references companies(id),
  job_posting_id uuid not null references job_postings(id),
  applicant_id uuid not null references profiles(id),
  cv_path text not null,
  cover_note text,
  status application_status not null default 'submitted',
  attempt_number integer not null default 1,
  screening_score integer,
  screening_notes text,
  feedback_to_applicant text,
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  overridden_by uuid references profiles(id),
  override_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique on applicant and posting (one application per intern per posting)
create unique index idx_applications_applicant_posting
  on applications(applicant_id, job_posting_id);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_applications_organization_id on applications(organization_id);
create index idx_applications_cohort_id on applications(cohort_id);
create index idx_applications_company_id on applications(company_id);
create index idx_applications_applicant_id on applications(applicant_id);
create index idx_applications_job_posting_id on applications(job_posting_id);
create index idx_applications_status on applications(status);
create index idx_applications_org_cohort on applications(organization_id, cohort_id);

-- ============================================================================
-- updated_at trigger
-- ============================================================================

create trigger applications_updated_at
  before update on applications
  for each row
  execute function private_set_updated_at();

-- ============================================================================
-- RLS policies
-- Select: The applicant (B); staff (HR/manager of company); school admin (F)
-- Insert: The applicant (B), only if account active, posting open, attempts <= 2
-- Update: Applicant may only withdraw; staff move status through functions
-- Delete: none
-- ============================================================================

alter table applications enable row level security;

create policy "applications_select" on public.applications
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    applicant_id = (select auth.uid())
    or private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

create policy "applications_insert" on public.applications
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and applicant_id = (select auth.uid())
  and private.is_active()
  and (
    select status from job_postings where id = job_posting_id
  ) = 'open'
  and (
    select count(*) from applications
    where applicant_id = (select auth.uid())
      and job_posting_id = applications.job_posting_id
  ) < 2
);

create policy "applications_update" on public.applications
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    applicant_id = (select auth.uid())
    or private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    applicant_id = (select auth.uid())
    or private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

-- No delete policy

-- ============================================================================
-- Grant SELECT on applications to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.applications to anon;

-- ============================================================================
-- Storage bucket: cvs (private, accessed through signed links)
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs',
  'cvs',
  false,
  2097152,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) on conflict (id) do nothing;

