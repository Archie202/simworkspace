"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

export async function submitTask(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const taskId = formData.get("task_id") as string;
  const note = formData.get("note") as string;
  const linksRaw = formData.get("links") as string;
  const files = formData.getAll("files") as File[];

  // Get task to verify permissions
  const { data: task } = await supabase
    .from("tasks")
    .select("id, company_id, cohort_id, organization_id, assignee_id")
    .eq("id", taskId)
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

  // Verify assignee
  if (task.assignee_id !== user.id) {
    redirect("/not-allowed");
  }

  // Get next version number
  const { data: existing } = await supabase
    .from("submissions")
    .select("version")
    .eq("task_id", taskId)
    .eq("author_id", user.id)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = (existing?.[0]?.version || 0) + 1;

  // Upload files to submissions bucket
  const serviceSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const filePaths: string[] = [];
  for (const file of files) {
    const fileName = `${task.id}/${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await serviceSupabase.storage
      .from("submissions")
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      redirect(`/tasks/${taskId}/submit?error=upload_failed`);
    }

    filePaths.push(fileName);
  }

  // Parse links
  let links: string[] = [];
  if (linksRaw) {
    try {
      links = JSON.parse(linksRaw);
      if (!Array.isArray(links)) {
        links = [linksRaw];
      }
    } catch {
      links = linksRaw.split(",").map((l) => l.trim()).filter(Boolean);
    }
  }

  // Insert submission
  const { error: insertError } = await supabase.from("submissions").insert({
    organization_id: profile.organization_id,
    cohort_id: task.cohort_id,
    company_id: task.company_id,
    task_id: taskId,
    author_id: user.id,
    note: note || null,
    links,
    file_paths: filePaths,
    version: nextVersion,
  });

  if (insertError) {
    redirect(`/tasks/${taskId}/submit?error=submit_failed`);
  }

  // Update task status to In review
  const { error: updateError } = await supabase
    .from("tasks")
    .update({ status: "in_review" })
    .eq("id", taskId);

  if (updateError) {
    redirect(`/tasks/${taskId}/submit?error=task_update_failed`);
  }

  redirect(`/tasks/${taskId}?success=submitted`);
}
