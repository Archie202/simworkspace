"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const rubricSchema = z.object({
  name: z.string().min(1, "Name is required"),
  kind: z.enum(["interview", "task", "review", "scenario"]),
  criteria: z.string(),
});

export async function createRubric(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const kind = formData.get("kind") as string;
  const criteriaRaw = formData.get("criteria") as string;

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Verify user is a trainer
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

  const parsed = rubricSchema.safeParse({
    name,
    kind,
    criteria: criteriaRaw,
  });

  if (!parsed.success) {
    redirect("/rubrics?error=invalid_rubric");
  }

  try {
    JSON.parse(parsed.data.criteria);
  } catch {
    redirect("/rubrics?error=invalid_criteria_json");
  }

  const { error } = await supabase.from("rubrics").insert({
    organization_id: profile.organization_id,
    name: parsed.data.name,
    kind: parsed.data.kind,
    criteria: JSON.parse(parsed.data.criteria),
    created_by: user.id,
  });

  if (error) {
    redirect("/rubrics?error=create_failed");
  }

  redirect("/rubrics?success=created");
}

export async function updateRubric(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rubric_id = formData.get("rubric_id") as string;
  const name = formData.get("name") as string;
  const kind = formData.get("kind") as string;
  const criteriaRaw = formData.get("criteria") as string;

  // Get the rubric to verify permissions
  const { data: rubric } = await supabase
    .from("rubrics")
    .select("id, organization_id, created_by")
    .eq("id", rubric_id)
    .single();

  if (!rubric) {
    redirect("/not-allowed");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || rubric.organization_id !== profile.organization_id) {
    redirect("/not-allowed");
  }

  // Verify user is a trainer of the organization
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

  const parsed = rubricSchema.safeParse({
    name,
    kind,
    criteria: criteriaRaw,
  });

  if (!parsed.success) {
    redirect(`/rubrics?error=invalid_rubric`);
  }

  try {
    JSON.parse(parsed.data.criteria);
  } catch {
    redirect(`/rubrics?error=invalid_criteria_json`);
  }

  const { error } = await supabase
    .from("rubrics")
    .update({
      name: parsed.data.name,
      kind: parsed.data.kind,
      criteria: JSON.parse(parsed.data.criteria),
    })
    .eq("id", rubric_id);

  if (error) {
    redirect("/rubrics?error=update_failed");
  }

  redirect("/rubrics?success=updated");
}
