"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export const SAFEGUARDING_SUMMARY_V1 = `Virtual Workplace Internship Platform — Safeguarding Summary for Guardians

This platform is a simulated remote workplace for digital-skills trainees. Your child has been invited to join a 6-week internship (4 hours per day) inside a fictional company run by their training provider.

What your child will do:
- Apply for and complete simulated work tasks
- Communicate with trainers, managers, and fellow interns through monitored chat channels
- Complete daily work tasks and receive reviews
- Participate in workplace scenario events

Safeguarding protections:
- All chat channels and direct messages are readable by trainers and the safeguarding lead
- No direct messages between adults and under-18 interns
- A named safeguarding lead receives and reviews all safeguarding reports
- Your consent is required before your child can participate
- You can withdraw consent at any time by contacting the safeguarding lead

By confirming below, you consent to your child participating in this internship programme.
`;

export async function confirmGuardianConsent(formData: FormData) {
  const guardianLinkId = formData.get("guardian_link_id") as string;
  const confirmed = formData.get("confirmed") === "true";

  if (!guardianLinkId) {
    redirect("/consent/confirm?error=missing_token");
  }

  // Use service role key to access data (guardian is not authenticated)
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the guardian link exists and is not yet verified
  const { data: link, error: linkError } = await supabase
    .from("guardian_links")
    .select(
      "*, intern:profiles!intern_id(organization_id, full_name, display_name)"
    )
    .eq("id", guardianLinkId)
    .single();

  if (linkError || !link) {
    redirect("/consent/confirm?error=invalid_token");
  }

  if (link.status === "verified") {
    redirect("/consent/confirm?error=already_verified");
  }

  if (!confirmed) {
    redirect("/consent/confirm?error=not_confirmed");
  }

  // Create consent record
  const { error: consentError } = await supabase.from("consent_records").insert({
    organization_id: link.intern.organization_id,
    intern_id: link.intern_id,
    guardian_link_id: guardianLinkId,
    kind: "guardian_consent",
    text_version: "v1",
    granted: true,
    granted_at: new Date().toISOString(),
    recorded_by: null,
  });

  if (consentError) {
    redirect("/consent/confirm?error=record_failed");
  }

  // Update guardian link status to verified
  const { error: updateError } = await supabase
    .from("guardian_links")
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .eq("id", guardianLinkId);

  if (updateError) {
    redirect("/consent/confirm?error=verify_failed");
  }

  redirect("/consent/confirm?success=confirmed");
}
