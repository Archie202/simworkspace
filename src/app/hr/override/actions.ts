"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const overrideSchema = z.object({
  application_id: z.string().uuid(),
  override_reason: z.string().min(1, "Override reason is required"),
});

export async function overrideDecision(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const applicationId = formData.get("application_id") as string;
  const overrideReason = formData.get("override_reason") as string;

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

  // Verify user has permission (trainer or school admin)
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", profile.organization_id);

  const isTrainer =
    userRoles?.some((r) => r.role === "trainer") ||
    userRoles?.some((r) => r.role === "school_admin");

  if (!isTrainer) {
    redirect("/not-allowed");
  }

  const parsed = overrideSchema.safeParse({
    application_id: applicationId,
    override_reason: overrideReason,
  });

  if (!parsed.success) {
    redirect(`/hr/override?error=validation_failed`);
  }

  // Call override_decision() via service role
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const serviceSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: rpcError } = await serviceSupabase.rpc("override_decision", {
    p_application_id: parsed.data.application_id,
    p_override_reason: parsed.data.override_reason,
    p_actor_id: user.id,
  });

  if (rpcError) {
    redirect(`/hr/override?error=override_failed`);
  }

  redirect(`/hr/override?success=override_done`);
}

export async function placeIntern(formData: FormData) {
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

  // Verify user has permission (trainer or school admin)
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", profile.organization_id);

  const isTrainer =
    userRoles?.some((r) => r.role === "trainer") ||
    userRoles?.some((r) => r.role === "school_admin");

  if (!isTrainer) {
    redirect("/not-allowed");
  }

  // Call place_intern() via service role
  const { createClient: createSupabaseClient2 } = await import("@supabase/supabase-js");
  const serviceSupabase2 = createSupabaseClient2(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: rpcError } = await serviceSupabase2.rpc("place_intern", {
    p_application_id: applicationId,
    p_actor_id: user.id,
  });

  if (rpcError) {
    redirect(`/hr/override?error=place_failed`);
  }

  redirect(`/hr/override?success=placement_done`);
}
