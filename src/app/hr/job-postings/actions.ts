"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const postingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  function: z.enum(["intern", "hr", "manager"]),
  track: z.enum([
    "software_development",
    "data_analytics",
    "program_management",
    "hr",
  ]),
  description: z.string().min(1, "Description is required"),
  requirements: z.string().optional(),
  openings: z.coerce.number().int().positive().default(1),
  status: z.enum(["draft", "open", "filled", "closed"]),
});

export async function createJobPosting(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const companyId = formData.get("company_id") as string;
  const title = formData.get("title") as string;
  const function_ = formData.get("function") as string;
  const track = formData.get("track") as string;
  const description = formData.get("description") as string;
  const requirements = formData.get("requirements") as string;
  const openings = parseInt(formData.get("openings") as string) || 1;
  const status = formData.get("status") as string;

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Verify user has HR/manager function in this company or is a trainer
  const { data: companyMember } = await supabase
    .from("company_members")
    .select("company_id, function, cohort_id")
    .eq("profile_id", user.id)
    .eq("company_id", companyId)
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

  const parsed = postingSchema.safeParse({
    title,
    function: function_,
    track,
    description,
    requirements,
    openings,
    status,
  });

  if (!parsed.success) {
    redirect("/hr/job-postings?error=validation_failed");
  }

  // Get cohort_id from company_members
  const cohortId = companyMember?.cohort_id || null;

  if (!cohortId) {
    redirect("/hr/job-postings?error=no_cohort");
  }

  const { error } = await supabase.from("job_postings").insert({
    title: parsed.data.title,
    function: parsed.data.function,
    track: parsed.data.track,
    description: parsed.data.description,
    requirements: parsed.data.requirements || null,
    openings: parsed.data.openings,
    status: parsed.data.status,
    organization_id: profile.organization_id,
    cohort_id: cohortId,
    company_id: companyId,
    created_by: user.id,
  });

  if (error) {
    redirect("/hr/job-postings?error=create_failed");
  }

  redirect("/hr/job-postings?success=created");
}

export async function updateJobPosting(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const postingId = formData.get("posting_id") as string;
  const status = formData.get("status") as string;

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Verify user has permission to update this posting
  const { data: posting } = await supabase
    .from("job_postings")
    .select("company_id, organization_id")
    .eq("id", postingId)
    .single();

  if (!posting || posting.organization_id !== profile.organization_id) {
    redirect("/not-allowed");
  }

  const { data: companyMember } = await supabase
    .from("company_members")
    .select("function")
    .eq("profile_id", user.id)
    .eq("company_id", posting.company_id)
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

  const validStatuses: readonly ("draft" | "open" | "filled" | "closed")[] = [
    "draft",
    "open",
    "filled",
    "closed",
  ];
  const postingStatus: "draft" | "open" | "filled" | "closed" =
    typeof status === "string" && validStatuses.includes(status as "draft" | "open" | "filled" | "closed")
      ? status as "draft" | "open" | "filled" | "closed"
      : "draft";

  const { error } = await supabase
    .from("job_postings")
    .update({ status: postingStatus })
    .eq("id", postingId);

  if (error) {
    redirect(`/hr/job-postings?error=update_failed`);
  }

  redirect("/hr/job-postings?success=updated");
}
