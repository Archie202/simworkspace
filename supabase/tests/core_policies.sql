-- Policy tests for core tables (docs/RLS_RULES.md section 3 and section 9).
-- Runs with `supabase test db` (pgTAP via Supabase CLI).

create extension if not exists pgtap;

-- ---------------------------------------------------------------------------
-- Helper: set the current user context for the authenticated role.
-- Uses set_config() so auth.uid() picks up the impersonated user id.
-- ---------------------------------------------------------------------------

create or replace function private.set_user_context(user_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = private, pg_catalog
as $$
begin
  perform set_config(
    'request.jwt.claims',
    format('{"sub": "%s"}', user_id),
    false
  );
end;
$$;

grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Test setup: create two organisations and test users per role.
-- (Runs as postgres superuser, so RLS is bypassed for setup only.)
-- ---------------------------------------------------------------------------
begin;

-- Clean up any leftover test data from previous runs
delete from public.company_members;
delete from public.cohort_members;
delete from public.user_roles;
delete from public.companies;
delete from public.cohorts;
delete from public.consent_records;
delete from public.guardian_links;
delete from public.profiles;
delete from public.organizations;

insert into public.organizations (id, name, slug)
values
  ('11111111-1111-1111-1111-111111111111', 'Org A', 'org-a'),
  ('22222222-2222-2222-2222-222222222222', 'Org B', 'org-b');

insert into public.profiles (id, organization_id, full_name, display_name, email, status, date_of_birth)
values
  ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Trainer A', 'Trainer A', 'trainer@a.test', 'active', null),
  ('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'School Admin A', 'School Admin A', 'admin@a.test', 'active', null),
  ('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Intern A1', 'Intern A1', 'intern1@a.test', 'active', '2000-01-01'),
  ('00000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Intern A2', 'Intern A2', 'intern2@a.test', 'active', '2000-01-01'),
  ('00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Under18 A', 'Under18 A', 'minor@a.test', 'pending_consent', '2010-01-01'),
  ('00000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Intern B', 'Intern B', 'intern@b.test', 'active', '2000-01-01');

insert into public.cohorts (id, organization_id, name, start_date, end_date, status, created_by)
values
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Cohort A1', '2027-01-01', '2027-02-15', 'active', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Cohort B1', '2027-01-01', '2027-02-15', 'active', '00000000-0000-0000-0000-000000000001');

insert into public.companies (id, organization_id, cohort_id, name, created_by)
values
  ('30000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', 'Company A1', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', '20000000-0000-0000-0000-000000000002', 'Company B1', '00000000-0000-0000-0000-000000000001');

insert into public.user_roles (id, user_id, organization_id, role, is_safeguarding_lead)
values
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'trainer', false),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'school_admin', true),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'intern', false),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'intern', false),
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'intern', false),
  ('00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'intern', false);

insert into public.cohort_members (id, organization_id, cohort_id, profile_id, cohort_role, status)
values
  ('00000000-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'trainer', 'active'),
  ('00000000-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'intern', 'active'),
  ('00000000-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'intern', 'active'),
  ('00000000-0000-0000-0000-000000000024', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'intern', 'active'),
  ('00000000-0000-0000-0000-000000000025', '22222222-2222-2222-2222-222222222222', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 'intern', 'active');

insert into public.company_members (id, organization_id, cohort_id, company_id, profile_id, function)
values
  ('00000000-0000-0000-0000-000000000031', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'intern'),
  ('00000000-0000-0000-0000-000000000032', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'intern'),
  ('00000000-0000-0000-0000-000000000033', '11111111-1111-1111-1111-111111111111', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'intern'),
  ('00000000-0000-0000-0000-000000000034', '22222222-2222-2222-2222-222222222222', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 'intern');

commit;

-- Ensure authenticated can call private helper functions
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- pgTAP tests
-- ---------------------------------------------------------------------------

\set ON_ERROR_STOP off
\set quietaudit off

select plan(14);

-- ---------------------------------------------------------------------------
-- 1. An intern in organisation A cannot read any row of organisation B
-- ---------------------------------------------------------------------------

select private.set_user_context('00000000-0000-0000-0000-000000000003');
set role authenticated;

select is(
  (select count(*) from public.organizations where id = '22222222-2222-2222-2222-222222222222')::int,
  0,
  'intern A cannot see org B row'
);

select is(
  (select count(*) from public.profiles where organization_id = '22222222-2222-2222-2222-222222222222')::int,
  0,
  'intern A cannot read org B profiles'
);

-- ---------------------------------------------------------------------------
-- 2. An intern cannot see Org B company
-- ---------------------------------------------------------------------------

select is(
  (select count(*) from public.companies where id = '30000000-0000-0000-0000-000000000002')::int,
  0,
  'intern A cannot see Org B company'
);

-- ---------------------------------------------------------------------------
-- 3. An intern cannot read another intern's profiles row
-- ---------------------------------------------------------------------------

select is(
  (select count(*) from public.profiles where id = '00000000-0000-0000-0000-000000000004')::int,
  0,
  'intern A1 cannot read intern A2 profile'
);

-- ---------------------------------------------------------------------------
-- 4. Column-level grants: no update on status/email/date_of_birth
-- ---------------------------------------------------------------------------

select is(
  (select count(*) from information_schema.role_column_grants
   where table_name = 'profiles'
     and column_name in ('status', 'email', 'date_of_birth')
     and grantee = 'authenticated'
     and privilege_type = 'UPDATE')::int,
  0,
  'authenticated has no update grant on status/email/date_of_birth'
);

-- ---------------------------------------------------------------------------
-- 5. profile_directory() returns teammates' display name and avatar only
-- ---------------------------------------------------------------------------

select is(
  (select count(*) from private.profile_directory())::int,
  3,
  'profile_directory returns 3 teammates for intern A1'
);

select ok(
  not exists (
    select 1 from private.profile_directory() pd
    join public.profiles p on p.id = pd.id
    where p.date_of_birth is not null
  ),
  'profile_directory does not expose date_of_birth'
);

-- ---------------------------------------------------------------------------
-- 6. The anon role cannot read any table
-- ---------------------------------------------------------------------------

set role anon;

select is(
  (select count(*) from public.organizations)::int,
  0,
  'anon cannot read organizations'
);

select is(
  (select count(*) from public.profiles)::int,
  0,
  'anon cannot read profiles'
);

select is(
  (select count(*) from public.cohorts)::int,
  0,
  'anon cannot read cohorts'
);

select is(
  (select count(*) from public.companies)::int,
  0,
  'anon cannot read companies'
);

-- ---------------------------------------------------------------------------
-- 7. School admin can read across their own organisation
-- ---------------------------------------------------------------------------

set role authenticated;
select private.set_user_context('00000000-0000-0000-0000-000000000002');
set role authenticated;

select ok(
  (select count(*) from public.profiles where organization_id = '11111111-1111-1111-1111-111111111111') >= 5,
  'school admin A can read org A profiles'
);

-- ---------------------------------------------------------------------------
-- 8. Trainer can read cohorts in their own org
-- ---------------------------------------------------------------------------

select private.set_user_context('00000000-0000-0000-0000-000000000001');
set role authenticated;

select ok(
  (select count(*) from public.cohorts where organization_id = '11111111-1111-1111-1111-111111111111') >= 1,
  'trainer A can read org A cohorts'
);

select is(
  (select count(*) from public.cohorts where organization_id = '22222222-2222-2222-2222-222222222222')::int,
  0,
  'trainer A cannot read org B cohorts'
);

-- ---------------------------------------------------------------------------
-- Finish
-- ---------------------------------------------------------------------------

select finish();

-- Cleanup (run as postgres, bypassing RLS)
reset role;

drop function if exists private.set_user_context(uuid);

-- Delete in FK dependency order: children before parents
delete from public.company_members;
delete from public.companies;
delete from public.cohort_members;
delete from public.cohorts;
delete from public.consent_records;
delete from public.guardian_links;
delete from public.user_roles;
delete from public.profiles;
delete from public.organizations;
