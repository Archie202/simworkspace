"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function makeOffer(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const applicationId = formData.get("application_id") as string;

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Get the application
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

  // Call make_offer() via service role
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const serviceSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: rpcError } = await serviceSupabase.rpc("make_offer", {
    p_application_id: applicationId,
    p_offered_by: user.id,
  });

  if (rpcError) {
    redirect(`/hr/offers?error=make_failed`);
  }

  redirect(`/hr/offers?success=offer_made`);
}
