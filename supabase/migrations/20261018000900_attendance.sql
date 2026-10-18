-- Attendance migration.
-- Follows docs/SCHEMA.md section 6 and docs/RLS_RULEs.md section 5.
--
-- Tables:
--   attendance - one row per profile per work_date
--
-- Functions:
--   clock_in() - records clock-in time for the day
--   clock_out() - records clock-out time and computes minutes_worked

-- ============================================================================
-- attendance_status enum
-- ============================================================================

create type attendance_status as enum (
  'present',
  'late',
  'absent',
  'excused'
);

-- ============================================================================
-- attendance table
-- ============================================================================

create table attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  profile_id uuid not null references profiles(id),
  work_date date not null,
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  minutes_worked integer,
  status attendance_status not null default 'absent',
  absence_reason text,
  confirmed_by uuid references profiles(id),
  edited_by uuid references profiles(id),
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, work_date)
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_attendance_organization_id on attendance(organization_id);
create index idx_attendance_cohort_id on attendance(cohort_id);
create index idx_attendance_profile_id on attendance(profile_id);
create index idx_attendance_work_date on attendance(work_date);
create index idx_attendance_status on attendance(status);
create index idx_attendance_org_cohort on attendance(organization_id, cohort_id);

-- ============================================================================
-- updated_at trigger
-- ============================================================================

create trigger attendance_updated_at
  before update on attendance
  for each row
  execute function private_set_updated_at();

-- ============================================================================
-- RLS policies for attendance
-- Select: Self (B); HR or manager of the person's company (D); trainers (E);
--         school admin (F); guardian of an under-18 (G)
-- Insert: Self, only through the clock_in function (one row per day,
--         inside the working window)
-- Update: Self, only through the clock_out function; trainers (E) for corrections
-- Delete: none
-- ============================================================================

alter table attendance enable row level security;

create policy "attendance_select" on public.attendance
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.company_function_of(
      (select company_id from company_members where profile_id = attendance.profile_id and ended_at is null limit 1)
    ) in ('hr', 'manager')
    or private.is_trainer_of(cohort_id)
    or private.has_role('school_admin')
    or private.is_guardian_of(profile_id)
  )
);

create policy "attendance_insert" on public.attendance
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and profile_id = (select auth.uid())
  and private.is_active()
);

create policy "attendance_update" on public.attendance
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.is_trainer_of(cohort_id)
  )
)
with check (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.is_trainer_of(cohort_id)
  )
);

-- No delete policy

-- ============================================================================
-- clock_in() function
-- ============================================================================

create function private.clock_in()
returns void
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_profile_id uuid;
  v_organization_id uuid;
  v_cohort_id uuid;
  v_work_date date;
  v_now timestamptz;
  v_work_start_time time;
  v_existing timestamptz;
begin
  v_profile_id := auth.uid();
  v_now := now();
  v_work_date := v_now::date;

  -- Get profile's organization and cohort
  select p.organization_id, cm.cohort_id
  into v_organization_id, v_cohort_id
  from profiles p
  join cohort_members cm on cm.profile_id = p.id
  where p.id = v_profile_id
    and cm.status = 'active'
  limit 1;

  if v_organization_id is null then
    raise exception 'Profile is not a member of any active cohort';
  end if;

  -- Check account is active
  if not private.is_active() then
    raise exception 'Account is not active';
  end if;

  -- Check for existing attendance today
  select clock_in_at into v_existing
  from attendance
  where profile_id = v_profile_id
    and work_date = v_work_date;

  if v_existing is not null then
    raise exception 'Already clocked in today';
  end if;

  -- Get company's work start time
  select c.work_start_time into v_work_start_time
  from cohorts c
  where c.id = v_cohort_id
  limit 1;

  -- Insert attendance row
  insert into attendance (
    organization_id,
    cohort_id,
    profile_id,
    work_date,
    clock_in_at,
    status,
    created_at,
    updated_at
  ) values (
    v_organization_id,
    v_cohort_id,
    v_profile_id,
    v_work_date,
    v_now,
    case
      when v_work_start_time is not null and v_now::time > v_work_start_time + interval '15 minutes'
      then 'late'::attendance_status
      else 'present'::attendance_status
    end,
    now(),
    now()
  );

end;
$$;

-- Grant execute to authenticated so server actions can call it
grant execute on function private.clock_in() to authenticated;

-- ============================================================================
-- clock_out() function
-- ============================================================================

create function private.clock_out()
returns void
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_profile_id uuid;
  v_work_date date;
  v_now timestamptz;
  v_clock_in_at timestamptz;
  v_minutes integer;
begin
  v_profile_id := auth.uid();
  v_now := now();
  v_work_date := v_now::date;

  -- Get existing attendance row
  select clock_in_at into v_clock_in_at
  from attendance
  where profile_id = v_profile_id
    and work_date = v_work_date;

  if v_clock_in_at is null then
    raise exception 'No clock-in record for today';
  end if;

  -- Compute minutes worked
  v_minutes := extract(epoch from (v_now - v_clock_in_at)) / 60;

  -- Update attendance row
  update attendance
  set clock_out_at = v_now,
      minutes_worked = v_minutes,
      updated_at = now()
  where profile_id = v_profile_id
    and work_date = v_work_date;

end;
$$;

-- Grant execute to authenticated so server actions can call it
grant execute on function private.clock_out() to authenticated;

-- ============================================================================
-- Grant SELECT to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.attendance to anon;
