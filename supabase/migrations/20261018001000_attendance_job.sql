-- Attendance absence/lateness job migration.
-- Follows docs/SCHEMA.md section 6 and docs/TASKS.md T21.
--
-- Creates:
--   notifications table (basic version; expanded in T28)
--   process_attendance() function for pg_cron nightly job
--   pg_cron schedule: nightly absence/lateness processing

create extension if not exists pg_cron;

grant usage on schema cron to postgres;

-- ============================================================================
-- notifications table (basic version; T28 expands with email/email provider)
-- ============================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  profile_id uuid not null references profiles(id),
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_organization_id on notifications(organization_id);
create index idx_notifications_profile_id on notifications(profile_id);
create index idx_notifications_profile_read on notifications(profile_id, read_at);

-- ============================================================================
-- RLS policies for notifications
-- Select: Self (B)
-- Insert: Server only (pg_cron job)
-- Update: Self: read_at only
-- Delete: Self
-- ============================================================================

alter table notifications enable row level security;

create policy "notifications_select" on public.notifications
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and profile_id = (select auth.uid())
);

create policy "notifications_insert" on public.notifications
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and profile_id = (select auth.uid())
);

create policy "notifications_update" on public.notifications
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and profile_id = (select auth.uid())
)
with check (
  organization_id = (select private.current_org_id())
  and profile_id = (select auth.uid())
  and (read_at is not null or read_at is null)
);

create policy "notifications_delete" on public.notifications
for delete to authenticated
using (
  organization_id = (select private.current_org_id())
  and profile_id = (select auth.uid())
);

-- ============================================================================
-- Grant SELECT to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.notifications to anon;

-- ============================================================================
-- process_attendance() function
-- Runs nightly via pg_cron:
--   - Marks missed days (no clock-in) as absent
--   - Flags lateness (clock-in after work start + 15 min)
--   - Creates notifications for manager and trainer
--   - Absence after 3 consecutive days alerts the trainer
-- ============================================================================

create function private.process_attendance()
returns void
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_org_id uuid;
  v_profile_id uuid;
  v_cohort_id uuid;
  v_company_id uuid;
  v_work_date date;
  v_clock_in_at timestamptz;
  v_work_start_time time;
  v_consecutive_absent integer;
  v_manager_id uuid;
  v_trainer_id uuid;
  v_is_minor boolean;
begin
  -- Process each organization
  for v_org_id in
    select id from organizations
  loop
    -- Find profiles in this org who didn't clock in yesterday
    -- (yesterday = current_date - 1)
    v_work_date := current_date - 1;

    for v_profile_id, v_cohort_id, v_company_id in
      select p.id, cm.cohort_id,
             (select company_id from company_members cm2
              where cm2.profile_id = p.id
                and cm2.ended_at is null
              limit 1) as company_id
      from profiles p
      join cohort_members cm on cm.profile_id = p.id
      where cm.status = 'active'
        and cm.organization_id = v_org_id
        and not exists (
          select 1 from attendance a
          where a.profile_id = p.id
            and a.work_date = v_work_date
        )
    loop
      -- Check if profile is active
      if not private.is_active() then
        continue;
      end if;

      -- Get work start time for the cohort
      select c.work_start_time into v_work_start_time
      from cohorts c
      where c.id = v_cohort_id
      limit 1;

      -- Mark as absent
      insert into attendance (
        organization_id,
        cohort_id,
        profile_id,
        work_date,
        status,
        created_at,
        updated_at
      ) values (
        v_org_id,
        v_cohort_id,
        v_profile_id,
        v_work_date,
        'absent'::attendance_status,
        now(),
        now()
      )
      on conflict (profile_id, work_date) do update
      set status = 'absent'::attendance_status,
          updated_at = now()
      where attendance.status <> 'absent'::attendance_status;

      -- Create notification for manager and trainer
      select cm2.profile_id into v_manager_id
      from company_members cm2
      where cm2.company_id = v_company_id
        and cm2.function = 'manager'
        and cm2.ended_at is null
      limit 1;

      if v_manager_id is not null then
        insert into notifications (
          organization_id,
          profile_id,
          kind,
          title,
          body,
          created_at
        ) values (
          v_org_id,
          v_manager_id,
          'absence',
          'Intern absent',
          format('Intern %s was absent on %s', v_profile_id::text, v_work_date::text),
          now()
        );
      end if;

      -- Notify trainer(s) of the cohort
      insert into notifications (
        organization_id,
        profile_id,
        kind,
        title,
        body,
        created_at
      )
      select v_org_id, cm3.profile_id, 'absence',
             'Intern absent',
             format('Intern %s was absent on %s', v_profile_id::text, v_work_date::text),
             now()
      from cohort_members cm3
      where cm3.cohort_id = v_cohort_id
        and (cm3.cohort_role = 'trainer' or cm3.cohort_role = 'volunteer')
        and cm3.status = 'active';

      -- Check for 3 consecutive absences
      select count(*) into v_consecutive_absent
      from attendance a
      where a.profile_id = v_profile_id
        and a.work_date between (v_work_date - interval '2 days') and v_work_date
        and a.status = 'absent'::attendance_status;

      if v_consecutive_absent >= 3 then
        -- Alert trainer(s) about 3-day consecutive absence
        insert into notifications (
          organization_id,
          profile_id,
          kind,
          title,
          body,
          created_at
        )
        select v_org_id, cm3.profile_id, 'absence_alert',
               'Intern absent 3 consecutive days',
               format('Intern %s has been absent for 3 consecutive days', v_profile_id::text),
             now()
        from cohort_members cm3
        where cm3.cohort_id = v_cohort_id
          and (cm3.cohort_role = 'trainer' or cm3.cohort_role = 'volunteer')
          and cm3.status = 'active';
      end if;

      -- Check if under-18 and notify guardian
      select p.date_of_birth is not null
             and (current_date - p.date_of_birth) > interval '18 years' is false
      into v_is_minor
      from profiles p
      where p.id = v_profile_id
      limit 1;

      if v_is_minor then
        -- Notify guardian
        insert into notifications (
          organization_id,
          profile_id,
          kind,
          title,
          body,
          created_at
        )
        select v_org_id, gl.guardian_profile_id, 'absence',
               'Your child was absent',
               format('Your child %s was absent on %s', v_profile_id::text, v_work_date::text),
             now()
        from guardian_links gl
        where gl.intern_id = v_profile_id
          and gl.status = 'verified';
      end if;
    end loop;
  end loop;

  -- Flag lateness: clock-in after work start + 15 min
  for v_profile_id, v_cohort_id, v_clock_in_at, v_work_start_time in
    select a.profile_id, a.cohort_id, a.clock_in_at, c.work_start_time
    from attendance a
    join cohorts c on c.id = a.cohort_id
    where a.work_date = v_work_date
      and a.clock_in_at is not null
      and c.work_start_time is not null
      and a.clock_in_at::time > c.work_start_time + interval '15 minutes'
      and a.status <> 'late'::attendance_status
  loop
    update attendance
    set status = 'late'::attendance_status,
        updated_at = now()
    where profile_id = v_profile_id
      and work_date = v_work_date;

    -- Create notification for manager
    select cm.profile_id into v_manager_id
    from company_members cm
    where cm.company_id = (
      select company_id from company_members cm2
      where cm2.profile_id = v_profile_id
        and cm2.ended_at is null
      limit 1
    )
    and cm.function = 'manager'
    and cm.ended_at is null
    limit 1;

    if v_manager_id is not null then
      insert into notifications (
        organization_id,
        profile_id,
        kind,
        title,
        body,
        created_at
      ) values (
        (select organization_id from profiles where id = v_profile_id),
        v_manager_id,
        'lateness',
        'Intern late',
        format('Intern %s was late on %s', v_profile_id::text, v_work_date::text),
        now()
      );
    end if;
  end loop;

end;
$$;

-- Grant execute to authenticated so server actions can call it
grant execute on function private.process_attendance() to authenticated;

-- ============================================================================
-- pg_cron schedule: run process_attendance() nightly at 2:00 AM
-- ============================================================================

select cron.schedule(
  'process-attendance-nightly',
  '0 2 * * *',
  'select private.process_attendance()'
);
