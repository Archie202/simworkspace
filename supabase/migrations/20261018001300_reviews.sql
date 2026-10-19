-- Review loop migration.
-- Follows docs/SCHEMA.md section 5 and docs/RLS_RULEs.md section 4.
--
-- Creates:
--   review_outcome enum
--   reviews table with RLS policies

-- ============================================================================
-- review_outcome enum
-- ============================================================================

create type review_outcome as enum (
  'approved',
  'changes_requested',
  'rejected'
);

-- ============================================================================
-- reviews table
-- ============================================================================

create table reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  company_id uuid not null references companies(id),
  submission_id uuid not null references submissions(id),
  reviewer_id uuid not null references profiles(id),
  outcome review_outcome not null,
  score integer,
  rubric_scores jsonb,
  comments text,
  disputed boolean not null default false,
  dispute_note text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_reviews_organization_id on reviews(organization_id);
create index idx_reviews_cohort_id on reviews(cohort_id);
create index idx_reviews_company_id on reviews(company_id);
create index idx_reviews_submission_id on reviews(submission_id);
create index idx_reviews_reviewer_id on reviews(reviewer_id);
create index idx_reviews_outcome on reviews(outcome);
create index idx_reviews_org_cohort on reviews(organization_id, cohort_id);

-- ============================================================================
-- RLS policies for reviews
-- Select: The submission's author (B); managers (D); trainers (E)
-- Insert: Manager (D) for that company; trainer (E)
-- Update: The author may only flag a dispute through a function; trainer (E)
-- Delete: none
-- ============================================================================

alter table reviews enable row level security;

create policy "reviews_select" on public.reviews
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    (select author_id from submissions where id = submission_id) = (select auth.uid())
    or private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
  )
);

create policy "reviews_insert" on public.reviews
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
  )
);

create policy "reviews_update" on public.reviews
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

-- No delete policy

-- ============================================================================
-- Grant SELECT to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.reviews to anon;
