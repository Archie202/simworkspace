-- Direct messages migration.
-- Follows docs/SCHEMA.md section 6 and docs/RLS_RULEs.md section 5.
--
-- Creates:
--   channel_allows_member(channel_id, profile_id) function - checks under-18 rule
--   create_direct_channel(a, b) function - creates direct channel, refuses adult-minor pairs
--   Restrictive insert policy on channel_members using channel_allows_member()

-- ============================================================================
-- channel_allows_member(channel_id, profile_id) function
-- Returns true if adding profile_id to channel_id doesn't violate under-18 rules.
-- For direct channels, blocks any pair with one adult and one under-18 person.
-- For non-direct channels, always allows.
-- ============================================================================

create function private.channel_allows_member(channel_id uuid, profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_channel_kind channel_kind;
  v_channel_org_id uuid;
  v_caller_minor boolean;
  v_target_minor boolean;
begin
  -- Get channel kind and org
  select kind, organization_id into v_channel_kind, v_channel_org_id
  from channels
  where id = channel_id;

  if not found then
    return false;
  end if;

  -- Non-direct channels always allow members
  if v_channel_kind <> 'direct' then
    return true;
  end if;

  -- Check if caller is under 18
  select is_minor(profile_id) into v_caller_minor;

  -- Check if the channel already has members (for direct channels, there should be exactly one other member)
  -- If there are existing members, check if adding this new member would create an adult-minor pair
  select is_minor(m.profile_id) into v_target_minor
  from channel_members m
  where m.channel_id = channel_id
  limit 1;

  -- If no existing members, this is the first member - always allow
  if not found then
    return true;
  end if;

  -- For direct channels: block if one is adult and other is under-18
  if v_caller_minor <> v_target_minor then
    return false;
  end if;

  return true;
end;
$$;

-- Grant execute to authenticated
grant execute on function private.channel_allows_member(uuid, uuid) to authenticated;

-- ============================================================================
-- create_direct_channel(a, b) function
-- Creates a direct channel between two people.
-- Refuses if one is adult and the other is under-18.
-- Returns the channel id.
-- ============================================================================

create function private.create_direct_channel(a uuid, b uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = private, public, pg_catalog
as $$
declare
  v_channel_id uuid;
  v_org_id uuid;
  v_a_minor boolean;
  v_b_minor boolean;
begin
  -- Get org from profile a
  select organization_id into v_org_id
  from profiles
  where id = a;

  if not found then
    raise exception 'Profile a not found';
  end if;

  -- Check under-18 rule
  select is_minor(a) into v_a_minor;
  select is_minor(b) into v_b_minor;

  if v_a_minor <> v_b_minor then
    raise exception 'Direct channels between adults and under-18 interns are not allowed';
  end if;

  -- Create the channel
  insert into channels (
    organization_id,
    cohort_id,
    name,
    kind,
    created_by
  ) values (
    v_org_id,
    (select cohort_id from cohort_members where profile_id = a and status = 'active' limit 1),
    'Direct Message',
    'direct',
    a
  ) returning id into v_channel_id;

  -- Add both members
  insert into channel_members (organization_id, channel_id, profile_id)
  values (v_org_id, v_channel_id, a),
         (v_org_id, v_channel_id, b);

  return v_channel_id;
end;
$$;

-- Grant execute to authenticated
grant execute on function private.create_direct_channel(uuid, uuid) to authenticated;

-- ============================================================================
-- Restrictive insert policy on channel_members
-- Uses channel_allows_member() to enforce under-18 rules
-- ============================================================================

create policy "channel_members_insert_restrictive" on public.channel_members
as restrictive
for insert to authenticated
with check (
  private.channel_allows_member(channel_id, profile_id)
);
