"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createMessage(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const channelId = formData.get("channel_id") as string;
  const body = formData.get("body") as string;

  if (!channelId || !body || !body.trim()) {
    redirect(`/chat?channel_id=${channelId}&error=empty_message`);
  }

  // Verify user is a member of the channel
  const { data: channelMember } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("channel_id", channelId)
    .eq("profile_id", user.id)
    .single();

  if (!channelMember) {
    redirect(`/chat?channel_id=${channelId}&error=not_a_member`);
  }

  // Get channel info for org_id and cohort_id
  const { data: channel } = await supabase
    .from("channels")
    .select("organization_id, cohort_id")
    .eq("id", channelId)
    .single();

  if (!channel) {
    redirect("/not-allowed");
  }

  const { error } = await supabase.from("messages").insert({
    organization_id: channel.organization_id,
    cohort_id: channel.cohort_id,
    channel_id: channelId,
    sender_id: user.id,
    body: body.trim(),
  });

  if (error) {
    redirect(`/chat?channel_id=${channelId}&error=send_failed`);
  }

  redirect(`/chat?channel_id=${channelId}`);
}
