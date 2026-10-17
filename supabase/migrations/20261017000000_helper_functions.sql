-- Helper functions for RLS policies.
-- All functions live in the `private` schema, are `security definer`,
-- stable, and use a fixed `search_path`. The API does not expose the
-- `private` schema, so these are not callable through the REST API.
-- Follows docs/SCHEMA.md section 8 and AGENTS.md security rules.
--
-- Enum types live in `public` and are schema-qualified here because the
-- function search_path is intentionally `private, pg_catalog` only.

create schema if not exists private;

alter schema private owner to postgres;

-- Fixed search_path for all helper functions.
-- `private` first (own schema), then `public` (tables and enums),
-- then `pg_catalog` (system).
alter database postgres set search_path to private, public, pg_catalog;

-- ---------------------------------------------------------------------------
-- current_org_id()
-- Returns the caller's organisation id, read from user_roles joined to
-- profiles (id = auth.uid()). Used for organisation-scoped policies.
-- ---------------------------------------------------------------------------

create function private.current_org_id()
returns uuid
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  result uuid;
begin
  select ur.organization_id
  into result
  from profiles p
  join user_roles ur on ur.user_id = p.id
  where p.id = auth.uid()
  limit 1;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- has_role(role_param public.app_role)
-- Whether the caller holds the given organisation-level role.
-- ---------------------------------------------------------------------------

create function private.has_role(role_param public.app_role)
returns boolean
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  result boolean;
begin
  select exists (
    select 1
    from public.profiles p
    join public.user_roles ur on ur.user_id = p.id
    where p.id = auth.uid()
      and ur.role = role_param
  )
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- is_trainer_of(cohort_id uuid)
-- Whether the caller is a trainer (or volunteer) in the given cohort.
-- ---------------------------------------------------------------------------

create function private.is_trainer_of(cohort_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  result boolean;
begin
  select exists (
    select 1
    from profiles p
    join cohort_members cm on cm.profile_id = p.id
    where p.id = auth.uid()
      and cm.cohort_id = is_trainer_of.cohort_id
      and cm.cohort_role in ('trainer', 'volunteer')
      and cm.status = 'active'
  )
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- is_cohort_member(cohort_id uuid)
-- Whether the caller is any member of the given cohort.
-- ---------------------------------------------------------------------------

create function private.is_cohort_member(cohort_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  result boolean;
begin
  select exists (
    select 1
    from profiles p
    join cohort_members cm on cm.profile_id = p.id
    where p.id = auth.uid()
      and cm.cohort_id = is_cohort_member.cohort_id
      and cm.status = 'active'
  )
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- company_function_of(company_id uuid)
-- The caller's function in the given company, or null if not a member.
-- Returns the public.company_function enum.
-- ---------------------------------------------------------------------------

create function private.company_function_of(company_id uuid)
returns public.company_function
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  result public.company_function;
begin
  select cm.function
  into result
  from profiles p
  join company_members cm on cm.profile_id = p.id
  where p.id = auth.uid()
    and cm.company_id = company_function_of.company_id
    and (cm.ended_at is null or cm.ended_at > now())
  limit 1;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- is_minor(profile_id uuid)
-- True when the profile is under 18 today, computed from date_of_birth.
-- Never stored; flips automatically on the 18th birthday.
-- ---------------------------------------------------------------------------

create function private.is_minor(profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  dob date;
  result boolean;
begin
  select date_of_birth
  into dob
  from profiles
  where id = is_minor.profile_id;

  if dob is null then
    return false;
  end if;

  select (age(current_date, dob) < interval '18 years')
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- is_guardian_of(profile_id uuid)
-- Whether the caller is the verified guardian of the given profile.
-- ---------------------------------------------------------------------------

create function private.is_guardian_of(profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  result boolean;
begin
  select exists (
    select 1
    from guardian_links gl
    where gl.intern_id = is_guardian_of.profile_id
      and gl.guardian_profile_id = auth.uid()
      and gl.status = 'verified'
  )
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- is_safeguarding_lead()
-- Whether the caller has the school_admin or trainer role with the
-- is_safeguarding_lead flag set.
-- ---------------------------------------------------------------------------

create function private.is_safeguarding_lead()
returns boolean
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  result boolean;
begin
  select exists (
    select 1
    from profiles p
    join user_roles ur on ur.user_id = p.id
    where p.id = auth.uid()
      and ur.role in ('school_admin'::public.app_role, 'trainer'::public.app_role)
      and ur.is_safeguarding_lead = true
  )
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- is_active()
-- Whether the caller's profile status is 'active'.
-- ---------------------------------------------------------------------------

create function private.is_active()
returns boolean
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  result boolean;
begin
  select exists (
    select 1
    from profiles
    where id = auth.uid()
      and status = 'active'::public.account_status
      and deleted_at is null
  )
  into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Revoke default access so the `private` schema is not exposed via the API.
-- ---------------------------------------------------------------------------

revoke all on schema private from anon, authenticated;
grant usage on schema private to postgres;
