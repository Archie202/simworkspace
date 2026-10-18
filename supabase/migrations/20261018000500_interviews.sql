-- Interviews migration.
-- Follows docs/SCHEMA.md section 4 and docs/RLS_RULEs.md section 4.
--
-- Interviews include scheduling (date, time, mode, call link),
-- a second adult for under-18 applicants, scoring with a rubric,
-- and feedback to the applicant.
-- Private staff scores and notes live in interview_staff_notes.

-- ============================================================================
-- interview_mode enum
-- ============================================================================

create type interview_mode as enum (
  'chat',
  'audio',
  'video'
);

-- ============================================================================
-- interview_status enum
-- ============================================================================

create type interview_status as enum (
  'scheduled',
  'done',
  'cancelled',
  'no_show'
);

-- ============================================================================
-- interviews table
-- ============================================================================

create table interviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  application_id uuid not null references applications(id),
  interviewer_id uuid not null references profiles(id),
  second_adult_id uuid references profiles(id),
  rubric_id uuid,
  mode interview_mode not null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30,
  meeting_url text,
  status interview_status not null default 'scheduled',
  scores jsonb,
  total_score integer,
  private_notes text,
  feedback_to_applicant text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- interview_staff_notes table
-- ============================================================================

create table interview_staff_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  interview_id uuid not null references interviews(id),
  author_id uuid not null references profiles(id),
  note text not null,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_interviews_organization_id on interviews(organization_id);
create index idx_interviews_cohort_id on interviews(cohort_id);
create index idx_interviews_application_id on interviews(application_id);
create index idx_interviews_interviewer_id on interviews(interviewer_id);
create index idx_interviews_second_adult_id on interviews(second_adult_id);
create index idx_interviews_status on interviews(status);
create index idx_interviews_scheduled_at on interviews(scheduled_at);
create index idx_interviews_org_cohort on interviews(organization_id, cohort_id);

create index idx_interview_staff_notes_organization_id
  on interview_staff_notes(organization_id);
create index idx_interview_staff_notes_interview_id
  on interview_staff_notes(interview_id);
create index idx_interview_staff_notes_author_id
  on interview_staff_notes(author_id);

-- ============================================================================
-- updated_at triggers
-- ============================================================================

create trigger interviews_updated_at
  before update on interviews
  for each row
  execute function private_set_updated_at();

create trigger interview_staff_notes_updated_at
  before update on interview_staff_notes
  for each row
  execute function private_set_updated_at();

-- ============================================================================
-- RLS policies for interviews
-- Select: The applicant, the interviewer, the second adult, staff, school admin (F)
-- Insert: HR or manager (D); trainer (E); second adult must be set for under-18 applicants
-- Update: Interviewer or trainer: schedule and status
-- Delete: none
-- ============================================================================

alter table interviews enable row level security;

create policy "interviews_select" on public.interviews
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    (select applicant_id from applications where id = application_id) = (select auth.uid())
    or interviewer_id = (select auth.uid())
    or second_adult_id = (select auth.uid())
    or private.company_function_of(
      (select company_id from job_postings where id = (select job_posting_id from applications where id = application_id))
    ) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

create policy "interviews_insert" on public.interviews
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and interviewer_id = (select auth.uid())
  and (
    -- Second adult required when applicant is under 18
    not private.is_minor(
      (select applicant_id from applications where id = application_id)
    )
    or second_adult_id is not null
  )
  and (
    private.company_function_of(
      (select company_id from job_postings where id = (select job_posting_id from applications where id = application_id))
    ) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
  )
);

create policy "interviews_update" on public.interviews
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    interviewer_id = (select auth.uid())
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    interviewer_id = (select auth.uid())
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

-- No delete policy

-- ============================================================================
-- RLS policies for interview_staff_notes
-- Select: Staff only
-- Insert: Interviewer; trainer (E)
-- Update: The author; trainer (E)
-- Delete: none
-- ============================================================================

alter table interview_staff_notes enable row level security;

create policy "interview_staff_notes_select" on public.interview_staff_notes
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.company_function_of(
      (select company_id from job_postings where id = (select job_posting_id from applications where id = (select application_id from interviews where id = interview_id)))
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from interviews where id = interview_id)
    )
    or private.has_role('school_admin')
  )
);

create policy "interview_staff_notes_insert" on public.interview_staff_notes
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and author_id = (select auth.uid())
  and (
    private.company_function_of(
      (select company_id from job_postings where id = (select job_posting_id from applications where id = (select application_id from interviews where id = interview_id)))
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from interviews where id = interview_id)
    )
  )
);

create policy "interview_staff_notes_update" on public.interview_staff_notes
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    author_id = (select auth.uid())
    or private.company_function_of(
      (select company_id from job_postings where id = (select job_posting_id from applications where id = (select application_id from interviews where id = interview_id)))
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from interviews where id = interview_id)
    )
    or private.has_role('school_admin')
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    author_id = (select auth.uid())
    or private.company_function_of(
      (select company_id from job_postings where id = (select job_posting_id from applications where id = (select application_id from interviews where id = interview_id)))
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from interviews where id = interview_id)
    )
    or private.has_role('school_admin')
  )
);

-- No delete policy

-- ============================================================================
-- Grant SELECT to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.interviews to anon;
grant select on public.interview_staff_notes to anon;
