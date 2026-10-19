"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const reviewSchema = z.object({
  submission_id: z.string().uuid(),
  outcome: z.enum(["approved", "changes_requested", "rejected"]),
  score: z.coerce.number().int().min(0).max(100).optional(),
  rubric_scores: z.string().optional(),
  comments: z.string().optional(),
});

export async function submitReview(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const submission_id = formData.get("submission_id") as string;
  const outcome = formData.get("outcome") as string;
  const scoreRaw = formData.get("score");
  const rubric_scores_raw = formData.get("rubric_scores") as string;
  const comments = formData.get("comments") as string;

  // Get the submission to verify permissions
  const { data: submission } = await supabase
    .from("submissions")
    .select("id, task_id, author_id, company_id, organization_id, cohort_id")
    .eq("id", submission_id)
    .single();

  if (!submission) {
    redirect("/not-allowed");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || submission.organization_id !== profile.organization_id) {
    redirect("/not-allowed");
  }

  // Verify user has permission (manager or trainer of the company)
  const { data: companyMember } = await supabase
    .from("company_members")
    .select("function")
    .eq("profile_id", user.id)
    .eq("company_id", submission.company_id!)
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

  const isManager =
    companyMember?.function === "manager";

  if (!isTrainer && !isManager) {
    redirect("/not-allowed");
  }

  const parsed = reviewSchema.safeParse({
    submission_id,
    outcome,
    score: scoreRaw ? parseInt(scoreRaw as string, 10) : undefined,
    rubric_scores: rubric_scores_raw,
    comments,
  });

  if (!parsed.success) {
    redirect(`/tasks/${submission.task_id}/review?error=invalid_review`);
  }

  // Insert review
  const { error: insertError } = await supabase.from("reviews").insert({
    organization_id: submission.organization_id,
    cohort_id: submission.cohort_id,
    company_id: submission.company_id!,
    submission_id: parsed.data.submission_id,
    reviewer_id: user.id,
    outcome: parsed.data.outcome,
    score: parsed.data.score,
    rubric_scores: parsed.data.rubric_scores
      ? JSON.parse(parsed.data.rubric_scores)
      : null,
    comments: parsed.data.comments || null,
  });

  if (insertError) {
    redirect(`/tasks/${submission.task_id}/review?error=review_failed`);
  }

  // Update task status based on outcome
  let newStatus: "todo" | "in_progress" | "in_review" | "changes_requested" | "done";
  if (parsed.data.outcome === "approved") {
    newStatus = "done";
  } else if (parsed.data.outcome === "changes_requested") {
    newStatus = "changes_requested";
  } else {
    newStatus = "todo";
  }

  const { error: updateError } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", submission.task_id);

  if (updateError) {
    redirect(`/tasks/${submission.task_id}/review?error=task_update_failed`);
  }

  redirect(`/tasks/${submission.task_id}?success=review_submitted`);
}

export async function disputeReview(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const review_id = formData.get("review_id") as string;
  const dispute_note = formData.get("dispute_note") as string;

  // Get the review
  const { data: review } = await supabase
    .from("reviews")
    .select("id, submission_id, reviewer_id")
    .eq("id", review_id)
    .single();

  if (!review) {
    redirect("/not-allowed");
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("id, author_id, task_id")
    .eq("id", review.submission_id!)
    .single();

  if (!submission || submission.author_id !== user.id) {
    redirect("/not-allowed");
  }

  // Dispute the review
  const { error: updateError } = await supabase
    .from("reviews")
    .update({ disputed: true, dispute_note: dispute_note || null })
    .eq("id", review_id);

  if (updateError) {
    redirect(`/tasks/${submission.task_id}/review?error=dispute_failed`);
  }

  redirect(`/tasks/${submission.task_id}?success=dispute_filed`);
}
