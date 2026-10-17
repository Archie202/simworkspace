-- Core schema migration: organisations, profiles, roles, guardians,
-- cohorts, companies, and memberships.
-- Follows docs/SCHEMA.md section 3 exactly.

-- Extensions
create extension if not exists pgcrypto;

-- ============================================
-- Enums (docs/SCHEMA.md section 3)
-- ============================================

create type app_role as enum (
  'platform_admin',
  'school_admin',
  'trainer',
  'employer',
  'guardian',
  'intern'
);

create type track as enum (
  'software_development',
  'data_analytics',
  'program_management',
  'hr'
);

create type account_status as enum (
  'invited',
  'pending_consent',
  'active',
  'suspended',
  'left'
);

create type cohort_status as enum (
  'draft',
  'hiring',
  'active',
  'completed'
);

create type company_function as enum (
  'intern',
  'hr',
  'manager'
);

-- ============================================
-- Core tables
-- ============================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_path text,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  full_name text not null,
  display_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  track track,
  bio text,
  avatar_path text,
  cv_path text,
  status account_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  organization_id uuid not null references organizations(id),
  role app_role not null,
  is_safeguarding_lead boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, organization_id, role)
);

create table guardian_links (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references profiles(id),
  guardian_profile_id uuid references profiles(id),
  guardian_name text not null,
  guardian_email text not null,
  relationship text not null,
  status text not null,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table cohorts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  start_date date not null,
  end_date date not null,
  daily_hours_target integer not null default 4,
  work_start_time time,
  status cohort_status not null default 'draft',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table cohort_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  profile_id uuid not null references profiles(id),
  cohort_role text not null check (cohort_role in ('intern', 'trainer', 'volunteer')),
  track track,
  status text not null check (status in ('active', 'withdrawn', 'completed')) default 'active',
  joined_at timestamptz not null default now(),
  unique (cohort_id, profile_id)
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  name text not null,
  industry text,
  description text,
  culture text,
  logo_path text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table company_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  company_id uuid not null references companies(id),
  profile_id uuid not null references profiles(id),
  function company_function not null,
  title text,
  is_standin boolean not null default false,
  job_posting_id uuid,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- ============================================
-- Indexes (docs/SCHEMA.md section 8)
-- ============================================

create index idx_organizations_slug on organizations(slug);

create index idx_profiles_organization_id on profiles(organization_id);

create index idx_user_roles_organization_id on user_roles(organization_id);
create index idx_user_roles_user_id on user_roles(user_id);

create index idx_guardian_links_intern_id on guardian_links(intern_id);
create index idx_guardian_links_guardian_profile_id on guardian_links(guardian_profile_id);

create index idx_cohorts_organization_id on cohorts(organization_id);
create index idx_cohorts_status on cohorts(status);

create index idx_cohort_members_organization_id on cohort_members(organization_id);
create index idx_cohort_members_cohort_id on cohort_members(cohort_id);
create index idx_cohort_members_profile_id on cohort_members(profile_id);
create index idx_cohort_members_org_cohort on cohort_members(organization_id, cohort_id);

create index idx_companies_organization_id on companies(organization_id);
create index idx_companies_cohort_id on companies(cohort_id);
create index idx_companies_org_cohort on companies(organization_id, cohort_id);

create index idx_company_members_organization_id on company_members(organization_id);
create index idx_company_members_cohort_id on company_members(cohort_id);
create index idx_company_members_company_id on company_members(company_id);
create index idx_company_members_profile_id on company_members(profile_id);
create index idx_company_members_org_cohort on company_members(organization_id, cohort_id);

-- ============================================
-- updated_at trigger (profiles)
-- ============================================

create or replace function private_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row
  execute function private_set_updated_at();

-- ============================================
-- Row-level security enabled on every table
-- (policies are written in T06 per docs/RLS_RULES.md)
-- ============================================

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table user_roles enable row level security;
alter table guardian_links enable row level security;
alter table cohorts enable row level security;
alter table cohort_members enable row level security;
alter table companies enable row level security;
alter table company_members enable row level security;
