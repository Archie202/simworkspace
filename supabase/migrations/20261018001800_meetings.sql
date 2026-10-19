-- Meetings migration.
-- Follows docs/SCHEMA.md section 6 and docs/RLS_RULEs.md section 5.
--
-- Creates:
--   meeting_kind enum
--   meetings table with RLS policies
--   meeting_attendees table with RLS policies

-- ============================================================================
-- meeting_kind enum
-- ============================================================================

create type meeting_kind as enum (
  'standup',
  'interview',
  'one_to_one',
  'workshop'
);

-- ============================================================================
-- meetings table
-- ============================================================================

create table meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  company_id uuid references companies(id),
  title text not null,
  kind meeting_kind not null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 30,
  meeting_url text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- meeting_attendees table
-- ============================================================================

create table meeting_attendees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  meeting_id uuid not null references meetings(id),
  profile_id uuid not null references profiles(id),
  rsvp text,
  attended boolean,
  unique (meeting_id, profile_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_meetings_organization_id on meetings(organization_id);
create index idx_meetings_cohort_id on meetings(cohort_id);
create index idx_meetings_company_id on meetings(company_id);
create index idx_meetings_starts_at on meetings(starts_at);

create index idx_meeting_attendees_organization_id on meeting_attendees(organization_id);
create index idx_meeting_attendees_meeting_id on meeting_attendees(meeting_id);
create index idx_meeting_attendees_profile_id on meeting_attendees(profile_id);

-- ============================================================================
-- updated_at trigger for meetings
-- ============================================================================

create trigger meetings_updated_at
  before update on meetings
  for each row
  execute function private_set_updated_at();

-- ============================================================================
-- RLS policies for meetings
-- Select: Attendees; company members for company meetings (C); trainers (E)
-- Insert: Manager (D); HR for interviews; trainer (E)
-- Update: Creator; trainer (E)
-- Delete: none
-- ============================================================================

alter table meetings enable row level security;

create policy "meetings_select" on public.meetings
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    id in (
      select meeting_id from meeting_attendees where profile_id = (select auth.uid())
    )
    or private.company_function_of(company_id) in ('intern', 'hr', 'manager')
    or private.is_trainer_of(cohort_id)
  )
);

create policy "meetings_insert" on public.meetings
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(cohort_id)
    or private.company_function_of(company_id) in ('hr', 'manager')
  )
);

create policy "meetings_update" on public.meetings
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    created_by = (select auth.uid())
    or private.is_trainer_of(cohort_id)
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    created_by = (select auth.uid())
    or private.is_trainer_of(cohort_id)
  )
);

-- No delete policy

-- ============================================================================
-- RLS policies for meeting_attendees
-- Select: Attendees of that meeting; trainers (E)
-- Insert: The meeting's creator; trainer (E)
-- Update: Self for rsvp; creator or trainer for attended
-- Delete: none
-- ============================================================================

alter table meeting_attendees enable row level security;

create policy "meeting_attendees_select" on public.meeting_attendees
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.is_trainer_of(
      (select cohort_id from meetings where id = meeting_id)
    )
  )
);

create policy "meeting_attendees_insert" on public.meeting_attendees
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.is_trainer_of(
      (select cohort_id from meetings where id = meeting_id)
    )
  )
);

create policy "meeting_attendees_update" on public.meeting_attendees
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.is_trainer_of(
      (select cohort_id from meetings where id = meeting_id)
    )
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.is_trainer_of(
      (select cohort_id from meetings where id = meeting_id)
    )
  )
);

-- No delete policy

-- ============================================================================
-- Grant SELECT to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.meetings to anon;
grant select on public.meeting_attendees to anon;
