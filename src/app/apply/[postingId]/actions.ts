"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function submitApplication(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const postingId = formData.get("posting_id") as string;
  const coverNote = formData.get("cover_note") as string;
  const cvFile = formData.get("cv") as File;

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, status, date_of_birth")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Check account is active
  if (profile.status !== "active") {
    redirect("/apply?error=account_not_active");
  }

  // Get the job posting
  const { data: posting } = await supabase
    .from("job_postings")
    .select("id, company_id, cohort_id, organization_id, status")
    .eq("id", postingId)
    .single();

  if (!posting) {
    redirect("/not-allowed");
  }

  // Check posting is open
  if (posting.status !== "open") {
    redirect(`/apply/${postingId}?error=posting_not_open`);
  }

  // Count existing applications by this applicant for this posting
  const { count: attemptCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("applicant_id", profile.id)
    .eq("job_posting_id", postingId);

  if (attemptCount && attemptCount >= 2) {
    redirect(`/apply/${postingId}?error=max_attempts`);
  }

  // Upload CV to cvs bucket
  const cvFileName = `${profile.id}/${postingId}/${Date.now()}-${cvFile.name}`;
  const serviceSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cvBytes = await cvFile.arrayBuffer();
  const { error: uploadError } = await serviceSupabase.storage
    .from("cvs")
    .upload(cvFileName, cvBytes, {
      contentType: cvFile.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    redirect(`/apply/${postingId}?error=upload_failed`);
  }

  // Determine attempt number
  const attemptNumber = (attemptCount || 0) + 1;

  // Insert application
  const { error: insertError } = await supabase.from("applications").insert({
    organization_id: profile.organization_id,
    cohort_id: posting.cohort_id,
    company_id: posting.company_id,
    job_posting_id: postingId,
    applicant_id: profile.id,
    cv_path: cvFileName,
    cover_note: coverNote || null,
    status: "submitted",
    attempt_number: attemptNumber,
  });

  if (insertError) {
    redirect(`/apply/${postingId}?error=submit_failed`);
  }

  redirect("/jobs?success=application_submitted");
}
