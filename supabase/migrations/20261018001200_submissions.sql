-- Submissions migration.
-- Follows docs/SCHEMA.md section 5 and docs/RLS_RULEs.md section 5.
--
-- Creates:
--   submissions table with RLS policies
--   submissions storage bucket (private, 10 MB limit)

-- ============================================================================
-- submissions table
-- ============================================================================

create table submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  company_id uuid not null references companies(id),
  task_id uuid not null references tasks(id),
  author_id uuid not null references profiles(id),
  note text,
  links text[] not null default '{}',
  file_paths text[] not null default '{}',
  version integer not null default 1,
  submitted_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_submissions_organization_id on submissions(organization_id);
create index idx_submissions_cohort_id on submissions(cohort_id);
create index idx_submissions_company_id on submissions(company_id);
create index idx_submissions_task_id on submissions(task_id);
create index idx_submissions_author_id on submissions(author_id);
create index idx_submissions_task_version on submissions(task_id, version);

-- ============================================================================
-- RLS policies for submissions
-- Select: The author (B); managers of the company (D); trainers (E)
-- Insert: The task's assignee, for their own tasks
-- Update: None; a resubmission adds a new version
-- Delete: none
-- ============================================================================

alter table submissions enable row level security;

create policy "submissions_select" on public.submissions
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    author_id = (select auth.uid())
    or private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
  )
);

create policy "submissions_insert" on public.submissions
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and author_id = (select auth.uid())
  and private.is_active()
);

-- No update/delete policies; resubmissions add new versions

-- ============================================================================
-- Grant SELECT to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.submissions to anon;

-- ============================================================================
-- Storage bucket: submissions (private, 10 MB limit)
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/zip',
    'application/x-zip-compressed',
    'application/json',
    'application/rtf'
  ]
) on conflict (id) do nothing;
