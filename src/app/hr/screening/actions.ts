"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function advanceApplication(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const applicationId = formData.get("application_id") as string;
  const newStatus = formData.get("status") as string;
  const feedback = formData.get("feedback_to_applicant") as string;

  // Verify user has permission (HR, manager, or trainer for this application's company/cohort)
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  const { data: application } = await supabase
    .from("applications")
    .select("company_id, cohort_id, organization_id")
    .eq("id", applicationId)
    .single();

  if (!application || application.organization_id !== profile.organization_id) {
    redirect("/not-allowed");
  }

  const { data: companyMember } = await supabase
    .from("company_members")
    .select("function")
    .eq("profile_id", user.id)
    .eq("company_id", application.company_id)
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

  // Rejecting requires written feedback
  if (newStatus === "rejected" && (!feedback || feedback.trim() === "")) {
    redirect(`/hr/screening?error=rejection_requires_feedback`);
  }

  // Call advance_application() via service role (security definer function)
  const serviceSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: rpcError } = await serviceSupabase.rpc("advance_application", {
    p_application_id: applicationId,
    p_new_status: newStatus,
    p_feedback_to_applicant: feedback || null,
    p_actor_id: user.id,
  });

  if (rpcError) {
    redirect(`/hr/screening?error=advance_failed`);
  }

  redirect(`/hr/screening?success=application_${newStatus}`);
}
