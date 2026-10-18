-- Task board migration.
-- Follows docs/SCHEMA.md section 5 and docs/RLS_RULEs.md section 4.
--
-- Creates:
--   task_status enum
--   priority enum
--   tasks table with RLS policies

-- ============================================================================
-- task_status enum
-- ============================================================================

create type task_status as enum (
  'todo',
  'in_progress',
  'in_review',
  'changes_requested',
  'done'
);

-- ============================================================================
-- priority enum
-- ============================================================================

create type priority as enum (
  'low',
  'medium',
  'high'
);

-- ============================================================================
-- tasks table
-- ============================================================================

create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  company_id uuid not null references companies(id),
  template_id uuid,
  title text not null,
  description text,
  assignee_id uuid references profiles(id),
  created_by uuid not null references profiles(id),
  status task_status not null default 'todo',
  priority priority not null default 'medium',
  due_at timestamptz,
  position integer not null default 0,
  rubric_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_tasks_organization_id on tasks(organization_id);
create index idx_tasks_cohort_id on tasks(cohort_id);
create index idx_tasks_company_id on tasks(company_id);
create index idx_tasks_assignee_id on tasks(assignee_id);
create index idx_tasks_status on tasks(status);
create index idx_tasks_company_status_position on tasks(company_id, status, position);
create index idx_tasks_org_cohort on tasks(organization_id, cohort_id);

-- ============================================================================
-- updated_at trigger
-- ============================================================================

create trigger tasks_updated_at
  before update on tasks
  for each row
  execute function private_set_updated_at();

-- ============================================================================
-- RLS policies for tasks
-- Select: Company members (C); trainers (E); school admin (F)
-- Insert: Manager (D); trainer (E)
-- Update: Manager and trainer: any field; the assignee: `status` only,
--         among todo, in progress, and in review
-- Delete: none
-- ============================================================================

alter table tasks enable row level security;

create policy "tasks_select" on public.tasks
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.company_function_of(company_id) is not null
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

create policy "tasks_insert" on public.tasks
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
  )
);

create policy "tasks_update" on public.tasks
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
    or (
      assignee_id = (select auth.uid())
      and status in ('todo', 'in_progress', 'in_review')
    )
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    private.company_function_of(company_id) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
    or (
      assignee_id = (select auth.uid())
      and status in ('todo', 'in_progress', 'in_review')
    )
  )
);

-- No delete policy

-- ============================================================================
-- Grant SELECT to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.tasks to anon;
