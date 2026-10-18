"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const interviewSchema = z.object({
  application_id: z.string().uuid(),
  interviewer_id: z.string().uuid(),
  second_adult_id: z.string().uuid().optional().nullable(),
  mode: z.enum(["chat", "audio", "video"]),
  scheduled_at: z.string().datetime(),
  duration_minutes: z.coerce.number().int().positive().max(480).default(30),
  meeting_url: z.string().url().optional().nullable(),
});

export async function scheduleInterview(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const applicationId = formData.get("application_id") as string;
  const interviewerId = formData.get("interviewer_id") as string;
  const secondAdultId = formData.get("second_adult_id") as string;
  const mode = formData.get("mode") as string;
  const scheduledAt = formData.get("scheduled_at") as string;
  const durationMinutes = parseInt(formData.get("duration_minutes") as string) || 30;
  const meetingUrl = formData.get("meeting_url") as string;

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Get the application with applicant info
  const { data: application } = await supabase
    .from("applications")
    .select("*, job_postings!inner(company_id, cohort_id, organization_id)")
    .eq("id", applicationId)
    .single();

  if (!application || application.job_postings.organization_id !== profile.organization_id) {
    redirect("/not-allowed");
  }

  // Verify user has permission (HR, manager of company, or trainer)
  const { data: companyMember } = await supabase
    .from("company_members")
    .select("function")
    .eq("profile_id", user.id)
    .eq("company_id", application.job_postings.company_id)
    .single();

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", profile.organization_id);

  const isTrainer =
    userRoles?.some((r) => r.role === "trainer") ||
    userRoles?.some((r) => r.role === "school_admin");

  const isHrOrManager =
    companyMember &&
    (companyMember.function === "hr" || companyMember.function === "manager");

  if (!isTrainer && !isHrOrManager) {
    redirect("/not-allowed");
  }

  // Check if applicant is under 18 — requires second adult
  const { data: applicantProfile } = await supabase
    .from("profiles")
    .select("date_of_birth")
    .eq("id", application.applicant_id)
    .single();

  const isMinor =
    applicantProfile?.date_of_birth &&
    new Date().getFullYear() - new Date(applicantProfile.date_of_birth).getFullYear() < 18;

  if (isMinor && !secondAdultId) {
    redirect(`/hr/interviews?error=second_adult_required`);
  }

  const parsed = interviewSchema.safeParse({
    application_id: applicationId,
    interviewer_id: interviewerId,
    second_adult_id: secondAdultId || null,
    mode,
    scheduled_at: scheduledAt,
    duration_minutes: durationMinutes,
    meeting_url: meetingUrl || null,
  });

  if (!parsed.success) {
    redirect(`/hr/interviews?error=validation_failed`);
  }

  // Insert interview
  const { error: insertError } = await supabase.from("interviews").insert({
    organization_id: profile.organization_id,
    cohort_id: application.job_postings.cohort_id,
    application_id: parsed.data.application_id,
    interviewer_id: parsed.data.interviewer_id,
    second_adult_id: parsed.data.second_adult_id,
    mode: parsed.data.mode,
    scheduled_at: parsed.data.scheduled_at,
    duration_minutes: parsed.data.duration_minutes,
    meeting_url: parsed.data.meeting_url,
    status: "scheduled",
  });

  if (insertError) {
    redirect(`/hr/interviews?error=schedule_failed`);
  }

  // Update application status to interview
  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: "interview" })
    .eq("id", applicationId);

  if (updateError) {
    redirect(`/hr/interviews?error=update_failed`);
  }

  redirect(`/hr/interviews?success=interview_scheduled`);
}
