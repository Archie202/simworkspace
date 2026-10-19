-- Announcements and notifications migration.
-- Follows docs/SCHEMA.md section 6 and docs/TASKS.md T28.
--
-- Adds:
--   Notifications triggered by offers, interviews, reviews, announcements
--   RLS policies for notifications

-- ============================================================================
-- Notifications table already exists from T21. Update RLS policies to allow
-- system (server) to insert notifications for any user in the organisation.
-- ============================================================================

-- Drop and re-create insert policy to allow system-triggered notifications
drop policy if exists "notifications_insert" on public.notifications;

create policy "notifications_insert" on public.notifications
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
);

-- ============================================================================
-- Trigger functions for notifications
-- ============================================================================

-- Notify on new job offer
create function private.notify_new_offer()
returns trigger
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_applicant_id uuid;
  v_org_id uuid;
begin
  select applicant_id, organization_id into v_applicant_id, v_org_id
  from applications
  where id = NEW.application_id;

  insert into notifications (
    organization_id,
    profile_id,
    kind,
    title,
    body,
    link,
    created_at
  ) values (
    v_org_id,
    v_applicant_id,
    'offer',
    'New Job Offer',
    'You have received a new job offer for ' || coalesce((select title from job_postings where id = (select job_posting_id from applications where id = NEW.application_id)), 'a position') || '.',
    '/offers/' || NEW.id,
    now()
  );

  return NEW;
end;
$$;

-- Notify on new interview
create function private.notify_new_interview()
returns trigger
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_applicant_id uuid;
  v_org_id uuid;
begin
  select a.applicant_id, a.organization_id into v_applicant_id, v_org_id
  from applications a
  where a.id = NEW.application_id;

  insert into notifications (
    organization_id,
    profile_id,
    kind,
    title,
    body,
    link,
    created_at
  ) values (
    v_org_id,
    v_applicant_id,
    'interview',
    'New Interview Scheduled',
    'You have a new interview scheduled for ' || coalesce(NEW.scheduled_at::text, 'an upcoming date') || '.',
    '/interviews/' || NEW.id,
    now()
  );

  return NEW;
end;
$$;

-- Notify on new review
create function private.notify_new_review()
returns trigger
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_applicant_id uuid;
  v_org_id uuid;
begin
  select s.author_id, s.organization_id into v_applicant_id, v_org_id
  from submissions s
  where s.id = NEW.submission_id;

  insert into notifications (
    organization_id,
    profile_id,
    kind,
    title,
    body,
    link,
    created_at
  ) values (
    v_org_id,
    v_applicant_id,
    'review',
    'New Review',
    'Your task submission has been reviewed with outcome: ' || NEW.outcome || '.',
    '/tasks/' || (select task_id from submissions where id = NEW.submission_id),
    now()
  );

  return NEW;
end;
$$;

-- Notify on new announcement
create function private.notify_new_announcement()
returns trigger
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from channels
  where id = NEW.channel_id;

  insert into notifications (
    organization_id,
    profile_id,
    kind,
    title,
    body,
    link,
    created_at
  )
  select
    v_org_id,
    cm.profile_id,
    'announcement',
    NEW.name,
    NEW.body,
    '/chat?channel_id=' || NEW.id,
    now()
  from channel_members cm
  where cm.channel_id = NEW.channel_id;

  return NEW;
end;
$$;

-- Grant execute to authenticated
grant execute on function private.notify_new_offer() to authenticated;
grant execute on function private.notify_new_interview() to authenticated;
grant execute on function private.notify_new_review() to authenticated;
grant execute on function private.notify_new_announcement() to authenticated;

-- ============================================================================
-- Triggers
-- ============================================================================

create trigger trigger_new_offer
after insert on offers
for each row
execute function private.notify_new_offer();

create trigger trigger_new_interview
after insert on interviews
for each row
execute function private.notify_new_interview();

create trigger trigger_new_review
after insert on reviews
for each row
execute function private.notify_new_review();

create trigger trigger_new_announcement
after insert on channels
for each row
when (NEW.kind = 'announcement')
execute function private.notify_new_announcement();
