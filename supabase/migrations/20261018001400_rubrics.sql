-- Rubrics and task library migration.
-- Follows docs/SCHEMA.md section 5 and docs/RLS_RULEs.md section 4.
--
-- Creates:
--   rubrics table — reusable scoring criteria for interviews, tasks, reviews, scenarios
--   task_templates table — reusable task library per track

-- ============================================================================
-- rubrics table
-- ============================================================================

create table rubrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  kind text not null,
  criteria jsonb not null default '[]',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- task_templates table
-- ============================================================================

create table task_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  track text not null,
  title text not null,
  description text,
  difficulty integer not null default 2,
  estimated_minutes integer,
  rubric_id uuid references rubrics(id),
  source text not null default 'trainer',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_rubrics_organization_id on rubrics(organization_id);
create index idx_rubrics_kind on rubrics(kind);
create index idx_rubrics_created_by on rubrics(created_by);
create index idx_rubrics_org_kind on rubrics(organization_id, kind);

create index idx_task_templates_organization_id on task_templates(organization_id);
create index idx_task_templates_track on task_templates(track);
create index idx_task_templates_rubric_id on task_templates(rubric_id);
create index idx_task_templates_created_by on task_templates(created_by);
create index idx_task_templates_org_track on task_templates(organization_id, track);

-- ============================================================================
-- updated_at triggers
-- ============================================================================

create trigger rubrics_updated_at
  before update on rubrics
  for each row
  execute function private_set_updated_at();

create trigger task_templates_updated_at
  before update on task_templates
  for each row
  execute function private_set_updated_at();

-- ============================================================================
-- RLS policies for rubrics
-- Select: Everyone in the organisation (so interns can see how they are marked)
-- Insert: Trainer (E)
-- Update: Trainer (E)
-- Delete: none
-- ============================================================================

alter table rubrics enable row level security;

create policy "rubrics_select" on public.rubrics
for select to authenticated
using (
  organization_id = (select private.current_org_id())
);

create policy "rubrics_insert" on public.rubrics
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(
    (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
  )
);

create policy "rubrics_update" on public.rubrics
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(
    (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
  )
)
with check (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(
    (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
  )
);

-- No delete policy

-- ============================================================================
-- RLS policies for task_templates
-- Select: Everyone in the organisation (so interns can see task library)
-- Insert: Trainer (E)
-- Update: Trainer (E)
-- Delete: none
-- ============================================================================

alter table task_templates enable row level security;

create policy "task_templates_select" on public.task_templates
for select to authenticated
using (
  organization_id = (select private.current_org_id())
);

create policy "task_templates_insert" on public.task_templates
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(
    (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
  )
);

create policy "task_templates_update" on public.task_templates
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(
    (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
  )
)
with check (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(
    (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
  )
);

-- No delete policy

-- ============================================================================
-- Grant SELECT to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.rubrics to anon;
grant select on public.task_templates to anon;
