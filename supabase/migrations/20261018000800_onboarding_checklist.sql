-- Onboarding checklist migration.
-- Follows docs/SCHEMA.md conventions and docs/TASKS.md T19.
--
-- Tables:
--   onboarding_checklist_items  - reusable checklist items per role
--   onboarding_checklist_progress - per-intern completion tracking

-- ============================================================================
-- onboarding_item_role enum
-- ============================================================================

create type onboarding_item_role as enum (
  'intern',
  'hr',
  'manager',
  'trainer'
);

-- ============================================================================
-- onboarding_checklist_items table
-- ============================================================================

create table onboarding_checklist_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  role onboarding_item_role not null,
  title text not null,
  description text,
  is_confirmation_item boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- onboarding_checklist_progress table
-- ============================================================================

create table onboarding_checklist_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  profile_id uuid not null references profiles(id),
  checklist_item_id uuid not null references onboarding_checklist_items(id),
  is_completed boolean not null default false,
  completed_by uuid references profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (profile_id, checklist_item_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_onboarding_checklist_items_organization_id
  on onboarding_checklist_items(organization_id);
create index idx_onboarding_checklist_items_role
  on onboarding_checklist_items(role);
create index idx_onboarding_checklist_progress_organization_id
  on onboarding_checklist_progress(organization_id);
create index idx_onboarding_checklist_progress_profile_id
  on onboarding_checklist_progress(profile_id);
create index idx_onboarding_checklist_progress_item_id
  on onboarding_checklist_progress(checklist_item_id);

-- ============================================================================
-- RLS policies for onboarding_checklist_items
-- Select: members of the organisation
-- Insert: trainer or school admin
-- Update: trainer or school admin
-- Delete: none
-- ============================================================================

alter table onboarding_checklist_items enable row level security;

create policy "onboarding_checklist_items_select" on public.onboarding_checklist_items
for select to authenticated
using (
  organization_id = (select private.current_org_id())
);

create policy "onboarding_checklist_items_insert" on public.onboarding_checklist_items
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(
      (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
    )
    or private.has_role('school_admin')
  )
);

create policy "onboarding_checklist_items_update" on public.onboarding_checklist_items
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(
      (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
    )
    or private.has_role('school_admin')
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(
      (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
    )
    or private.has_role('school_admin')
  )
);

-- ============================================================================
-- RLS policies for onboarding_checklist_progress
-- Select: self; trainers of the intern's cohort; school admin
-- Insert: self (non-confirmation items); HR or trainer (confirmation items)
-- Update: self (non-confirmation items); HR or trainer (confirmation items)
-- Delete: none
-- ============================================================================

alter table onboarding_checklist_progress enable row level security;

create policy "onboarding_checklist_progress_select" on public.onboarding_checklist_progress
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.is_trainer_of(
      (select cohort_id from cohort_members where profile_id = onboarding_checklist_progress.profile_id and status = 'active' limit 1)
    )
    or private.has_role('school_admin')
  )
);

create policy "onboarding_checklist_progress_insert" on public.onboarding_checklist_progress
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    -- Self-marking non-confirmation items
    (
      profile_id = (select auth.uid())
      and not (
        select is_confirmation_item
        from onboarding_checklist_items
        where id = onboarding_checklist_progress.checklist_item_id
      )
    )
    or
    -- HR or trainer confirming confirmation items
    (
      private.company_function_of(
        (select company_id from company_members where profile_id = (select auth.uid()) and ended_at is null limit 1)
      ) in ('hr', 'manager')
      or private.is_trainer_of(
        (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
      )
    )
  )
);

create policy "onboarding_checklist_progress_update" on public.onboarding_checklist_progress
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    (
      profile_id = (select auth.uid())
      and not (
        select is_confirmation_item
        from onboarding_checklist_items
        where id = onboarding_checklist_progress.checklist_item_id
      )
    )
    or
    private.company_function_of(
      (select company_id from company_members where profile_id = (select auth.uid()) and ended_at is null limit 1)
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
    )
    or private.has_role('school_admin')
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    (
      profile_id = (select auth.uid())
      and not (
        select is_confirmation_item
        from onboarding_checklist_items
        where id = onboarding_checklist_progress.checklist_item_id
      )
    )
    or
    private.company_function_of(
      (select company_id from company_members where profile_id = (select auth.uid()) and ended_at is null limit 1)
    ) in ('hr', 'manager')
    or private.is_trainer_of(
      (select cohort_id from cohort_members where profile_id = (select auth.uid()) and status = 'active' limit 1)
    )
    or private.has_role('school_admin')
  )
);

-- ============================================================================
-- Default checklist items for intern role
-- ============================================================================

insert into public.onboarding_checklist_items (
  organization_id,
  role,
  title,
  description,
  is_confirmation_item,
  order_index
)
select
  o.id,
  'intern'::onboarding_item_role,
  item.title,
  item.description,
  item.is_confirmation_item,
  item.order_index
from public.organizations o
cross join (
  values
    ('Set up your workspace', 'Configure your computer and accounts', false, 1),
    ('Read the company handbook', 'Familiarize yourself with company policies', false, 2),
    ('Meet your manager', 'Schedule your first 1:1 with your manager', false, 3),
    ('Complete security training', 'Finish the mandatory security awareness module', true, 4),
    ('Set up your work calendar', 'Add recurring meetings and block focus time', false, 5),
    ('Review task board', 'Look at the Kanban board for your team', false, 7)
) as item(title, description, is_confirmation_item, order_index);

-- ============================================================================
-- Grant SELECT to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.onboarding_checklist_items to anon;
grant select on public.onboarding_checklist_progress to anon;
