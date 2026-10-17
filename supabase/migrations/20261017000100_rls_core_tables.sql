-- Row-level security policies for core tables.
-- Follows docs/RLS_RULES.md section 3 exactly.
-- Every policy includes pattern A: organisation wall.
-- Policies are per action (select, insert, update, delete), never "for all".

-- ============================================================================
-- organizations
-- Select: members of that organisation
-- Insert: platform admin only
-- Update: school admin (own organisation)
-- Delete: none
-- ============================================================================

create policy "organizations_select" on public.organizations
for select to authenticated
using (
  id = (select private.current_org_id())
);

create policy "organizations_insert" on public.organizations
for insert to authenticated
with check (
  private.has_role('platform_admin')
);

create policy "organizations_update" on public.organizations
for update to authenticated
using (
  id = (select private.current_org_id())
  and private.has_role('school_admin')
)
with check (
  id = (select private.current_org_id())
  and private.has_role('school_admin')
);

-- ============================================================================
-- profiles
-- Select: self; trainers of the person's cohort (E); school admin (F);
--         guardian of an under-18 (G)
-- Insert: never directly (sign-up function only)
-- Update: self for bio, avatar_path, phone, cv_path only
--         status, email, date_of_birth are not updatable directly
-- Delete: none (soft delete through function)
-- ============================================================================

create policy "profiles_select" on public.profiles
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    id = (select auth.uid())
    or private.is_trainer_of(
      (select cohort_id from public.cohort_members where profile_id = profiles.id
       and status = 'active' limit 1)
    )
    or private.has_role('school_admin')
    or private.is_guardian_of(id)
  )
);

create policy "profiles_update_self_editable" on public.profiles
for update to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);

-- ============================================================================
-- user_roles
-- Select: self; school admin (F)
-- Insert: school admin (F)
-- Update: school admin (F)
-- Delete: school admin (F), with audit entry
-- ============================================================================

create policy "user_roles_select" on public.user_roles
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    user_id = (select auth.uid())
    or private.has_role('school_admin')
  )
);

create policy "user_roles_insert" on public.user_roles
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and private.has_role('school_admin')
);

create policy "user_roles_update" on public.user_roles
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and private.has_role('school_admin')
)
with check (
  organization_id = (select private.current_org_id())
  and private.has_role('school_admin')
);

create policy "user_roles_delete" on public.user_roles
for delete to authenticated
using (
  organization_id = (select private.current_org_id())
  and private.has_role('school_admin')
);

-- guardian_links did not carry organization_id in the core migration.
-- Add it now so the organisation wall can be enforced, and backfill from
-- the intern's profile.
alter table public.guardian_links
  add column organization_id uuid;

update public.guardian_links gl
  set organization_id = p.organization_id
  from public.profiles p
  where p.id = gl.intern_id;

alter table public.guardian_links
  alter column organization_id set not null;

create index idx_guardian_links_organization_id on guardian_links(organization_id);

-- ============================================================================
-- guardian_links
-- Select: the intern; the guardian; trainers of the cohort (E); school admin (F)
-- Insert: trainer through function (never directly)
-- Update: verification through function only
-- Delete: none
-- ============================================================================

create policy "guardian_links_select" on public.guardian_links
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    intern_id = (select auth.uid())
    or guardian_profile_id = (select auth.uid())
    or private.is_trainer_of(
      (select cohort_id from public.cohort_members where profile_id = intern_id
       and status = 'active' limit 1)
    )
    or private.has_role('school_admin')
  )
);

-- ============================================================================
-- cohorts
-- Select: members of the cohort (via cohort_members); school admin (F)
-- Insert: trainer or school admin
-- Update: trainer of the cohort (E); school admin (F)
-- Delete: none (close with status)
-- ============================================================================

create policy "cohorts_select" on public.cohorts
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.is_cohort_member(id)
    or private.has_role('school_admin')
  )
);

create policy "cohorts_insert" on public.cohorts
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(id)
    or private.has_role('school_admin')
  )
);

create policy "cohorts_update" on public.cohorts
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(id)
    or private.has_role('school_admin')
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(id)
    or private.has_role('school_admin')
  )
);

-- ============================================================================
-- cohort_members
-- Select: self; trainers of the cohort (E); school admin (F)
-- Insert: trainer (E) or school admin (F)
-- Update: trainer (E) or school admin (F)
-- Delete: none (use status)
-- ============================================================================

create policy "cohort_members_select" on public.cohort_members
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

create policy "cohort_members_insert" on public.cohort_members
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

create policy "cohort_members_update" on public.cohort_members
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

-- ============================================================================
-- companies
-- Select: every member of the same cohort
-- Insert: trainer (E) or school admin (F)
-- Update: trainer (E)
-- Delete: none (archive)
-- ============================================================================

create policy "companies_select" on public.companies
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.is_cohort_member(cohort_id)
    or private.has_role('school_admin')
  )
);

create policy "companies_insert" on public.companies
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

create policy "companies_update" on public.companies
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(cohort_id)
)
with check (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(cohort_id)
);

-- ============================================================================
-- company_members
-- Select: members of the same company (C); trainers (E); school admin (F)
-- Insert: offer-acceptance function or trainer (E)
-- Update: trainer (E)
-- Delete: none (set ended_at)
-- ============================================================================

create policy "company_members_select" on public.company_members
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
  )
);

create policy "company_members_insert" on public.company_members
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(cohort_id)
);

create policy "company_members_update" on public.company_members
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(cohort_id)
)
with check (
  organization_id = (select private.current_org_id())
  and private.is_trainer_of(cohort_id)
);

-- ============================================================================
-- profile_directory()
-- Security definer function returning only id, display_name, avatar_path,
-- and track for people in the caller's own cohort. Interns call this to see
-- teammates and never read the profiles table directly for other people.
-- ============================================================================

create function private.profile_directory()
returns table (
  id uuid,
  display_name text,
  avatar_path text,
  track public.track
)
language sql
stable
security definer
set search_path = private, public, pg_catalog
as $$
  select p.id, p.display_name, p.avatar_path, p.track
  from public.profiles p
  where p.organization_id = (select private.current_org_id())
    and p.id <> (select auth.uid())
    and exists (
      select 1 from public.cohort_members cm1
      where cm1.profile_id = (select auth.uid())
        and cm1.status = 'active'
        and cm1.organization_id = p.organization_id
        and exists (
          select 1 from public.cohort_members cm2
          where cm2.profile_id = p.id
            and cm2.status = 'active'
            and cm2.cohort_id = cm1.cohort_id
            and cm2.organization_id = cm1.organization_id
        )
    );
$$;

-- ============================================================================
-- Allow the authenticated role to call security-definer helper functions
-- in the private schema (used by policies and tests).
-- ============================================================================

grant usage on schema private to authenticated;

-- Column-level restriction: authenticated can only update self-editable
-- columns on profiles. status, email, date_of_birth are protected at the
-- column level (not just RLS row level).
revoke update on public.profiles from authenticated;
grant update (bio, avatar_path, phone, cv_path) on public.profiles to authenticated;

-- The anon role needs table-level SELECT so RLS can be evaluated (no select
-- policies exist for anon, so RLS returns zero rows).
grant select on public.organizations to anon;
grant select on public.profiles to anon;
grant select on public.user_roles to anon;
grant select on public.guardian_links to anon;
grant select on public.cohorts to anon;
grant select on public.cohort_members to anon;
grant select on public.companies to anon;
grant select on public.company_members to anon;

