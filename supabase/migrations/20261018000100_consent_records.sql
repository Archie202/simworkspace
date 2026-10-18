-- Guardian consent records and restrictive "no activity before consent" policies.
-- Follows docs/SCHEMA.md section 7 and docs/RLS_RULEs.md section 7.
--
-- consent_kind enum: guardian_consent, code_of_conduct, privacy_notice, record_sharing
-- consent_records stores the text version, time, and who recorded it.
-- A restrictive policy on cohort-scoped tables requires status = 'active',
-- so an under-18 intern stays blocked until consent is recorded.

-- ============================================================================
-- consent_kind enum
-- ============================================================================

create type consent_kind as enum (
  'guardian_consent',
  'code_of_conduct',
  'privacy_notice',
  'record_sharing'
);

-- ============================================================================
-- consent_records table
-- ============================================================================

create table consent_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  intern_id uuid not null references profiles(id),
  guardian_link_id uuid references guardian_links(id),
  kind consent_kind not null,
  text_version text not null,
  granted boolean not null default false,
  granted_at timestamptz,
  recorded_by uuid references profiles(id),
  evidence_path text,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_consent_records_organization_id on consent_records(organization_id);
create index idx_consent_records_intern_id on consent_records(intern_id);
create index idx_consent_records_guardian_link_id on consent_records(guardian_link_id);
create index idx_consent_records_kind on consent_records(kind);

-- ============================================================================
-- RLS policies for consent_records
-- Select: the intern; the guardian; trainers (E); school admin (F)
-- Insert: record-consent functions only
-- Update: revocation function only
-- Delete: none
-- ============================================================================

alter table consent_records enable row level security;

create policy "consent_records_select" on public.consent_records
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    intern_id = (select auth.uid())
    or private.is_guardian_of(intern_id)
    or private.is_trainer_of(
      (select cohort_id from public.cohort_members where profile_id = intern_id
       and status = 'active' limit 1)
    )
    or private.has_role('school_admin')
  )
);

-- ============================================================================
-- Restrictive "no activity before consent" policies on cohort-scoped tables
-- These layer on top of existing permissive policies and always win.
-- An under-18 with status != 'active' is blocked from all cohort-scoped data.
-- ============================================================================

-- cohorts: restrictive select
create policy "cohorts_no_activity_before_consent" on public.cohorts
as restrictive
for select to authenticated
using (
  private.is_active()
);

-- cohort_members: restrictive select
create policy "cohort_members_no_activity_before_consent" on public.cohort_members
as restrictive
for select to authenticated
using (
  private.is_active()
);

-- companies: restrictive select
create policy "companies_no_activity_before_consent" on public.companies
as restrictive
for select to authenticated
using (
  private.is_active()
);

-- company_members: restrictive select
create policy "company_members_no_activity_before_consent" on public.company_members
as restrictive
for select to authenticated
using (
  private.is_active()
);

-- ============================================================================
-- Grant SELECT on consent_records to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.consent_records to anon;
