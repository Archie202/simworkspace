-- Communication and attendance tables.
-- Follows docs/SCHEMA.md section 6 and docs/RLS_RULEs.md section 5.
--
-- Creates:
--   channel_kind enum
--   channels table
--   channel_members table
--   messages table with RLS policies

-- ============================================================================
-- channel_kind enum
-- ============================================================================

create type channel_kind as enum (
  'company',
  'team',
  'announcement',
  'group',
  'direct'
);

-- ============================================================================
-- channels table
-- ============================================================================

create table channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  company_id uuid references companies(id),
  name text not null,
  kind channel_kind not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

-- ============================================================================
-- channel_members table
-- ============================================================================

create table channel_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  channel_id uuid not null references channels(id),
  profile_id uuid not null references profiles(id),
  joined_at timestamptz not null default now(),
  unique (channel_id, profile_id)
);

-- ============================================================================
-- messages table
-- ============================================================================

create table messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  cohort_id uuid not null references cohorts(id),
  channel_id uuid not null references channels(id),
  sender_id uuid not null references profiles(id),
  body text not null,
  attachment_paths text[] not null default '{}',
  reply_to_id uuid references messages(id),
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references profiles(id)
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_channels_organization_id on channels(organization_id);
create index idx_channels_cohort_id on channels(cohort_id);
create index idx_channels_company_id on channels(company_id);

create index idx_channel_members_organization_id on channel_members(organization_id);
create index idx_channel_members_channel_id on channel_members(channel_id);
create index idx_channel_members_profile_id on channel_members(profile_id);

create index idx_messages_organization_id on messages(organization_id);
create index idx_messages_cohort_id on messages(cohort_id);
create index idx_messages_channel_id on messages(channel_id);
create index idx_messages_channel_created_at on messages(channel_id, created_at desc);
create index idx_messages_sender_id on messages(sender_id);
create index idx_messages_reply_to_id on messages(reply_to_id);

-- ============================================================================
-- RLS policies for channels
-- Select: Channel members; trainers (E) see every channel in their cohorts
-- Insert: Trainer (E); manager (D) for company channels; direct channels only through a function
-- Update: Creator or trainer (E): name and archive
-- Delete: none; archive
-- ============================================================================

alter table channels enable row level security;

create policy "channels_select" on public.channels
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    private.is_cohort_member(cohort_id)
    or private.is_trainer_of(cohort_id)
  )
);

create policy "channels_insert" on public.channels
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(cohort_id)
    or private.company_function_of(company_id) in ('hr', 'manager')
  )
);

create policy "channels_update" on public.channels
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
-- RLS policies for channel_members
-- Select: Members of the same channel; trainers (E)
-- Insert: Trainer (E); manager (D); direct channels through a function
-- Update: none
-- Delete: none; leaving is a status change
-- ============================================================================

alter table channel_members enable row level security;

create policy "channel_members_select" on public.channel_members
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    profile_id = (select auth.uid())
    or private.is_trainer_of(
      (select cohort_id from channels where id = channel_id)
    )
  )
);

create policy "channel_members_insert" on public.channel_members
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and (
    private.is_trainer_of(
      (select cohort_id from channels where id = channel_id)
    )
    or private.company_function_of(
      (select company_id from channels where id = channel_id)
    ) in ('hr', 'manager')
  )
);

-- No update/delete policies

-- ============================================================================
-- RLS policies for messages
-- Select: Channel members; trainers (E)
-- Insert: A channel member, with sender_id equal to the caller and the channel not archived
-- Update: The sender, for body only; the original goes to the audit log
-- Delete: None; soft delete through a function
-- ============================================================================

alter table messages enable row level security;

create policy "messages_select" on public.messages
for select to authenticated
using (
  organization_id = (select private.current_org_id())
  and (
    channel_id in (
      select channel_id from channel_members where profile_id = (select auth.uid())
    )
    or private.is_trainer_of(cohort_id)
  )
);

create policy "messages_insert" on public.messages
for insert to authenticated
with check (
  organization_id = (select private.current_org_id())
  and sender_id = (select auth.uid())
  and channel_id in (
    select channel_id from channel_members where profile_id = (select auth.uid())
  )
);

create policy "messages_update" on public.messages
for update to authenticated
using (
  organization_id = (select private.current_org_id())
  and sender_id = (select auth.uid())
)
with check (
  organization_id = (select private.current_org_id())
  and sender_id = (select auth.uid())
);

-- No delete policy

-- ============================================================================
-- Grant SELECT to anon (RLS returns zero rows without policy)
-- ============================================================================

grant select on public.channels to anon;
grant select on public.channel_members to anon;
grant select on public.messages to anon;
