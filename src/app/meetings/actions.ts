"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const rsvpSchema = z.object({
  meeting_id: z.string().uuid(),
  rsvp: z.enum(["yes", "no", "maybe"]),
});

export async function rsvpMeeting(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meeting_id = formData.get("meeting_id") as string;
  const rsvp = formData.get("rsvp") as string;

  const parsed = rsvpSchema.safeParse({
    meeting_id,
    rsvp,
  });

  if (!parsed.success) {
    redirect("/meetings?error=invalid_rsvp");
  }

  // Verify the meeting exists and user is an attendee
  const { data: attendee } = await supabase
    .from("meeting_attendees")
    .select("id, meeting_id, profile_id")
    .eq("meeting_id", parsed.data.meeting_id)
    .eq("profile_id", user.id)
    .single();

  if (!attendee) {
    redirect("/meetings?error=not_an_attendee");
  }

  const { error } = await supabase
    .from("meeting_attendees")
    .update({ rsvp: parsed.data.rsvp })
    .eq("id", attendee.id);

  if (error) {
    redirect("/meetings?error=update_failed");
  }

  redirect("/meetings?success=rsvp_updated");
}

export async function createMeeting(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = formData.get("title") as string;
  const kind = formData.get("kind") as string;
  const starts_at = formData.get("starts_at") as string;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string) || 30;
  const meeting_url = formData.get("meeting_url") as string;
  const company_id = formData.get("company_id") as string;

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Verify user is a trainer or manager
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", profile.organization_id);

  const isTrainer =
    userRoles?.some((r) => r.role === "trainer") ||
    userRoles?.some((r) => r.role === "school_admin");

  if (!company_id) {
    redirect("/not-allowed");
  }

  const { data: companyMember } = await supabase
    .from("company_members")
    .select("function")
    .eq("profile_id", user.id)
    .eq("company_id", company_id!)
    .is("ended_at", null)
    .single();

  const isManager = companyMember?.function === "manager";

  if (!isTrainer && !isManager) {
    redirect("/not-allowed");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id, cohort_id")
    .eq("id", company_id)
    .single();

  if (!company) {
    redirect("/not-allowed");
  }

  const { error } = await supabase.from("meetings").insert({
    organization_id: profile.organization_id,
    company_id: company_id,
    cohort_id: company.cohort_id,
    title,
    kind: kind as "standup" | "interview" | "one_to_one" | "workshop",
    starts_at,
    duration_minutes,
    meeting_url,
    created_by: user.id,
  });

  if (error) {
    redirect("/meetings?error=create_failed");
  }

  redirect("/meetings?success=meeting_created");
}

export async function createMeetingAttendee(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meeting_id = formData.get("meeting_id") as string;
  const profile_id = formData.get("profile_id") as string;

  // Get meeting to verify company/org
  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, organization_id")
    .eq("id", meeting_id)
    .single();

  if (!meeting) {
    redirect("/meetings?error=meeting_not_found");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", profile_id)
    .single();

  if (!profile || profile.organization_id !== meeting.organization_id) {
    redirect("/not-allowed");
  }

  const { error } = await supabase.from("meeting_attendees").insert({
    organization_id: meeting.organization_id,
    meeting_id,
    profile_id,
  });

  if (error) {
    redirect("/meetings?error=add_attendee_failed");
  }

  redirect("/meetings?success=attendee_added");
}
