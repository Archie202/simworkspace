-- Job postings migration.
-- Follows docs/SCHEMA.md section 4 and docs/RLS_RULEs.md section 4.

-- ============================================================================
-- posting_status enum
-- ============================================================================

create type posting_status as enum (
  'draft',
  'open',
  'filled',
  'closed'
);

-- ============================================================================
-- job_postings table
-- ============================================================================

create table job_postings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  company_id uuid not null references companies(id),
  title text not null,
  function company_function not null,
  track track not null,
  description text not null,
  requirements text,
  openings integer not null default 1,
  status posting_status not null default 'draft',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_job_postings_organization_id on job_postings(organization_id);
create index idx_job_postings_cohort_id on job_postings(cohort_id);
create index idx_job_postings_company_id on job_postings(company_id);
create index idx_job_postings_status on job_postings(status);
create index idx_job_postings_org_cohort on job_postings(organization_id, cohort_id);

-- ============================================================================
-- updated_at trigger
-- ============================================================================

create trigger job_postings_updated_at
  before update on job_postings
  for each row
  execute function private_set_updated_at();

-- ============================================================================
-- RLS policies
-- Select: Open postings: every cohort member; drafts: company HR or manager (D),
--         trainers (E), school admin (F)
-- Insert: HR or manager (D); trainer (E)
-- Update: HR or manager (D); trainer (E)
-- Delete: none (close with status)
-- ============================================================================

alter table job_postings enable row level security;

create policy "job_postings_select" on public.job_postings
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    (status = 'open' and private.is_cohort_member(cohort_id))
    or private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

create policy "job_postings_insert" on public.job_postings
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
  )
);

create policy "job_postings_update" on public.job_postings
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
  )
);

-- No delete policy - close with status instead

-- ============================================================================
-- Grant SELECT on job_postings to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.job_postings to anon;
