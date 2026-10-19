"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const createTemplateSchema = z.object({
  track: z.string().min(1, "Track is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(3).default(2),
  estimated_minutes: z.coerce.number().int().min(1).optional(),
  rubric_id: z.string().uuid().optional(),
});

export async function createTaskTemplate(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const track = formData.get("track") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const difficultyRaw = formData.get("difficulty") as string;
  const estimated_minutesRaw = formData.get("estimated_minutes") as string;
  const rubric_id = formData.get("rubric_id") as string;

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

  const parsed = createTemplateSchema.safeParse({
    track,
    title,
    description,
    difficulty: difficultyRaw ? parseInt(difficultyRaw, 10) : 2,
    estimated_minutes: estimated_minutesRaw
      ? parseInt(estimated_minutesRaw, 10)
      : undefined,
    rubric_id: rubric_id || undefined,
  });

  if (!parsed.success) {
    redirect("/tasks/library?error=invalid_template");
  }

  const { error } = await supabase.from("task_templates").insert({
    organization_id: profile.organization_id,
    track: parsed.data.track,
    title: parsed.data.title,
    description: parsed.data.description || null,
    difficulty: parsed.data.difficulty,
    estimated_minutes: parsed.data.estimated_minutes || null,
    rubric_id: parsed.data.rubric_id,
    source: "trainer",
    created_by: user.id,
  });

  if (error) {
    redirect("/tasks/library?error=create_failed");
  }

  redirect("/tasks/library?success=created");
}

export async function createTaskFromTemplate(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const template_id = formData.get("template_id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const assignee_id = formData.get("assignee_id") as string;
  const company_id = formData.get("company_id") as string;
  const due_at = formData.get("due_at") as string;

  // Get user's organization and cohort
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  const { data: member } = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .single();

  if (!member) {
    redirect("/not-allowed");
  }

  // Verify user is a trainer or manager
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", profile.organization_id);

  const isTrainer =
    userRoles?.some((r) => r.role === "trainer") ||
    userRoles?.some((r) => r.role === "school_admin");

  const { data: companyMember } = await supabase
    .from("company_members")
    .select("function")
    .eq("profile_id", user.id)
    .eq("company_id", company_id!)
    .is("ended_at", null)
    .single();

  const isManager = companyMember?.function === "manager";

  if (!isTrainer && !isManager) {
    redirect("/not-allowed");
  }

  const { error } = await supabase.from("tasks").insert({
    organization_id: profile.organization_id,
    cohort_id: member.cohort_id,
    company_id,
    template_id,
    title,
    description: description || null,
    assignee_id: assignee_id || null,
    created_by: user.id,
    status: "todo",
    priority: "medium",
    due_at: due_at || null,
  });

  if (error) {
    redirect("/tasks/library?error=create_failed");
  }

  redirect("/tasks/library?success=template_created");
}
