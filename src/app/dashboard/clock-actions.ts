"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function clockIn() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date().toISOString();
  const today = now.split("T")[0];

  // Get profile's organization and cohort
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found." };
  }

  const { data: member } = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .single();

  if (!member) {
    return { error: "Not a member of any active cohort." };
  }

  // Check for existing attendance today
  const { data: existing } = await supabase
    .from("attendance")
    .select("clock_in_at")
    .eq("profile_id", user.id)
    .eq("work_date", today)
    .maybeSingle();

  if (existing?.clock_in_at) {
    return { error: "Already clocked in today." };
  }

  const { error } = await supabase.from("attendance").insert({
    organization_id: profile.organization_id,
    cohort_id: member.cohort_id,
    profile_id: user.id,
    work_date: today,
    clock_in_at: now,
    status: "present",
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Clocked in successfully." };
}

export async function clockOut() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date().toISOString();
  const today = now.split("T")[0];

  // Get existing attendance row
  const { data: attendance, error: fetchError } = await supabase
    .from("attendance")
    .select("clock_in_at")
    .eq("profile_id", user.id)
    .eq("work_date", today)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!attendance?.clock_in_at) {
    return { error: "No clock-in record for today." };
  }

  const clockInAt = new Date(attendance.clock_in_at);
  const clockOutAt = new Date(now);
  const minutesWorked = Math.round(
    (clockOutAt.getTime() - clockInAt.getTime()) / (1000 * 60)
  );

  const { error } = await supabase
    .from("attendance")
    .update({
      clock_out_at: now,
      minutes_worked: minutesWorked,
    })
    .eq("profile_id", user.id)
    .eq("work_date", today);

  if (error) {
    return { error: error.message };
  }

  return { success: "Clocked out successfully." };
}

export async function getAttendance() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: attendance, error } = await supabase
    .from("attendance")
    .select("clock_in_at, clock_out_at, minutes_worked, status")
    .eq("profile_id", user.id)
    .eq("work_date", today)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!attendance) {
    return { status: "none", minutesWorked: null };
  }

  return {
    status: attendance.clock_out_at ? "clocked_out" : "clocked_in",
    minutesWorked: attendance.minutes_worked ?? null,
  };
}
