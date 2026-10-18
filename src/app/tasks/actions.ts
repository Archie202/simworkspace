"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_at: z.string().datetime().optional(),
});

const moveTaskSchema = z.object({
  task_id: z.string().uuid(),
  status: z.enum(["todo", "in_progress", "in_review", "changes_requested", "done"]),
});

export async function createTask(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const titleRaw = formData.get("title");
  const descriptionRaw = formData.get("description");
  const assignee_id_raw = formData.get("assignee_id");
  const company_id_raw = formData.get("company_id");
  const priorityRaw = formData.get("priority");
  const due_at_raw = formData.get("due_at");

  const title = typeof titleRaw === "string" ? titleRaw : "";
  const description =
    typeof descriptionRaw === "string" ? descriptionRaw : undefined;
  const assignee_id =
    typeof assignee_id_raw === "string" ? assignee_id_raw : undefined;
  const company_id =
    typeof company_id_raw === "string" ? company_id_raw : undefined;
  const priority =
    typeof priorityRaw === "string" ? priorityRaw : "medium";
  const due_at =
    typeof due_at_raw === "string" ? due_at_raw : undefined;

  const parsed = createTaskSchema.safeParse({
    title,
    description,
    assignee_id,
    company_id,
    priority,
    due_at,
  });

  if (!parsed.success) {
    redirect("/tasks?error=create_failed");
  }

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

  const { data: companyMember } = await supabase
    .from("company_members")
    .select("function")
    .eq("profile_id", user.id)
    .eq("company_id", parsed.data.company_id!)
    .is("ended_at", null)
    .single();

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", profile.organization_id);

  const isTrainer =
    userRoles?.some((r) => r.role === "trainer") ||
    userRoles?.some((r) => r.role === "school_admin");

  const isManager = companyMember?.function === "manager";

  if (!isTrainer && !isManager) {
    redirect("/not-allowed");
  }

  const { error } = await supabase.from("tasks").insert({
    organization_id: profile.organization_id,
    cohort_id: member.cohort_id,
    company_id: parsed.data.company_id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    assignee_id: parsed.data.assignee_id,
    created_by: user.id,
    status: "todo",
    priority: parsed.data.priority,
    due_at: parsed.data.due_at,
  });

  if (error) {
    redirect("/tasks?error=create_failed");
  }

  redirect("/tasks?success=task_created");
}

export async function moveTask(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const taskIdRaw = formData.get("task_id");
  const statusRaw = formData.get("status");

  const task_id =
    typeof taskIdRaw === "string" ? taskIdRaw : undefined;
  const status =
    typeof statusRaw === "string" ? statusRaw : undefined;

  if (!task_id || !status) {
    redirect("/not-allowed");
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, status, assignee_id, company_id, organization_id")
    .eq("id", task_id)
    .single();

  if (!task) {
    redirect("/not-allowed");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || task.organization_id !== profile.organization_id) {
    redirect("/not-allowed");
  }

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
    .eq("company_id", task.company_id!)
    .is("ended_at", null)
    .single();

  const isManagerOrHR =
    companyMember?.function === "manager" ||
    companyMember?.function === "hr";

  const isAssignee = task.assignee_id === user.id;

  if (!isTrainer && !isManagerOrHR && !isAssignee) {
    redirect("/not-allowed");
  }

  if (isAssignee && !isTrainer && !isManagerOrHR) {
    const allowedStatuses = ["todo", "in_progress", "in_review"];
    if (!allowedStatuses.includes(status)) {
      redirect("/tasks?error=invalid_status_move");
    }
  }

  const parsed = moveTaskSchema.safeParse({
    task_id,
    status,
  });

  if (!parsed.success) {
    redirect("/tasks?error=invalid_move");
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.task_id);

  if (error) {
    redirect("/tasks?error=update_failed");
  }

  redirect("/tasks?success=task_updated");
}

export async function moveTaskToNext(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const taskIdRaw = formData.get("task_id");
  const task_id =
    typeof taskIdRaw === "string" ? taskIdRaw : undefined;

  if (!task_id) {
    redirect("/not-allowed");
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, status, company_id, organization_id, assignee_id")
    .eq("id", task_id)
    .single();

  if (!task) {
    redirect("/not-allowed");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || task.organization_id !== profile.organization_id) {
    redirect("/not-allowed");
  }

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
    .eq("company_id", task.company_id!)
    .is("ended_at", null)
    .single();

  const isManagerOrHR =
    companyMember?.function === "manager" ||
    companyMember?.function === "hr";

  const isAssignee = task.assignee_id === user.id;

  if (!isTrainer && !isManagerOrHR && !isAssignee) {
    redirect("/not-allowed");
  }

  if (isAssignee && !isTrainer && !isManagerOrHR) {
    const current = task.status;
    const allowed = ["todo", "in_progress", "in_review"];
    if (!allowed.includes(current)) {
      redirect("/tasks?error=invalid_status_move");
    }
  }

  const statuses: ("todo" | "in_progress" | "in_review" | "changes_requested" | "done")[] = [
    "todo",
    "in_progress",
    "in_review",
    "changes_requested",
    "done",
  ];
  const currentIdx = statuses.indexOf(task.status);
  const nextStatus = currentIdx >= 0 && currentIdx < statuses.length - 1
    ? statuses[currentIdx + 1]
    : task.status;

  const { error } = await supabase
    .from("tasks")
    .update({ status: nextStatus })
    .eq("id", task_id);

  if (error) {
    redirect("/tasks?error=update_failed");
  }

  redirect("/tasks?success=task_updated");
}

export async function reopenTask(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const taskIdRaw = formData.get("task_id");
  const task_id =
    typeof taskIdRaw === "string" ? taskIdRaw : undefined;

  if (!task_id) {
    redirect("/not-allowed");
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, status, company_id, organization_id")
    .eq("id", task_id)
    .single();

  if (!task) {
    redirect("/not-allowed");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || task.organization_id !== profile.organization_id) {
    redirect("/not-allowed");
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status: "todo" })
    .eq("id", task_id);

  if (error) {
    redirect("/tasks?error=update_failed");
  }

  redirect("/tasks?success=task_updated");
}
