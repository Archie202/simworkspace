"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCohort(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const dailyHoursTarget = parseInt(formData.get("daily_hours_target") as string) || 4;
  const workStartTime = formData.get("work_start_time") as string;

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  const { error } = await supabase.from("cohorts").insert({
    name,
    organization_id: profile.organization_id,
    start_date: startDate,
    end_date: endDate,
    daily_hours_target: dailyHoursTarget,
    work_start_time: workStartTime || null,
    status: "draft",
    created_by: user.id,
  });

  if (error) {
    redirect("/trainer/cohorts?error=create_failed");
  }

  redirect("/trainer/cohorts");
}
