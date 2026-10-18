"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function recordConsent(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const internId = formData.get("intern_id") as string;
  const textVersion = formData.get("text_version") as string;

  // Get trainer's organization and role
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Verify the trainer is in the same org as the intern
  const { data: internProfile } = await supabase
    .from("profiles")
    .select("id, organization_id, status, date_of_birth")
    .eq("id", internId)
    .single();

  if (!internProfile || internProfile.organization_id !== profile.organization_id) {
    redirect("/not-allowed");
  }

  // Verify guardian link exists and is verified
  const { data: guardianLink } = await supabase
    .from("guardian_links")
    .select("*")
    .eq("intern_id", internId)
    .eq("status", "verified")
    .single();

  if (!guardianLink) {
    redirect("/trainer/consent?error=no_verified_guardian");
  }

  // Check if consent already recorded
  const { data: existingConsent } = await supabase
    .from("consent_records")
    .select("id")
    .eq("intern_id", internId)
    .eq("kind", "guardian_consent")
    .eq("granted", true)
    .single();

  if (existingConsent) {
    redirect("/trainer/consent?error=consent_already_recorded");
  }

  // Record consent
  const { error: consentError } = await supabase.from("consent_records").insert({
    organization_id: profile.organization_id,
    intern_id: internId,
    guardian_link_id: guardianLink.id,
    kind: "guardian_consent",
    text_version: textVersion,
    granted: true,
    granted_at: new Date().toISOString(),
    recorded_by: user.id,
  });

  if (consentError) {
    redirect("/trainer/consent?error=record_failed");
  }

  // Activate the intern account
  const { error: activateError } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", internId);

  if (activateError) {
    redirect("/trainer/consent?error=activate_failed");
  }

  redirect("/trainer/consent?success=recorded");
}
