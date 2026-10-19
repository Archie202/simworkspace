import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { submitReview, disputeReview } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OUTCOME_LABELS: Record<string, string> = {
  approved: "Approved",
  changes_requested: "Request Changes",
  rejected: "Rejected",
};

const OUTCOME_BADGE: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  changes_requested: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: { taskId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the task with submission
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*, submissions(*, author:profiles!author_id(display_name), reviews(*, reviewer:profiles!reviewer_id(display_name)))")
    .eq("id", params.taskId)
    .single();

  if (taskError || !task) {
    redirect("/not-allowed");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Verify user has permission (manager or trainer of the company)
  const { data: companyMember } = await supabase
    .from("company_members")
    .select("function")
    .eq("profile_id", user.id)
    .eq("company_id", task.company_id!)
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

  const isAuthor =
    task.submissions?.[0]?.author_id === user.id;

  if (!isTrainer && !isManager && !isAuthor) {
    redirect("/not-allowed");
  }

  const submission = task.submissions?.[0];
  const existingReview = submission?.reviews?.[0];

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let statusMessage: string | undefined;
  if (success === "review_submitted") {
    statusMessage = "Review submitted successfully.";
  } else if (success === "dispute_filed") {
    statusMessage = "Dispute filed successfully.";
  } else if (error === "invalid_review") {
    statusMessage = "Invalid review data. Please try again.";
  } else if (error === "review_failed") {
    statusMessage = "Review submission failed. Please try again.";
  } else if (error === "task_update_failed") {
    statusMessage = "Task status update failed. Please try again.";
  } else if (error === "dispute_failed") {
    statusMessage = "Dispute filing failed. Please try again.";
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Task Review</h1>
          <p className="text-sm text-text-muted">
            Review the submission and provide feedback.
          </p>
        </div>
        <a href={`/tasks/${params.taskId}`} className="Button">
          Back to Task
        </a>
      </div>

      {statusMessage && (
        <div className="mb-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="border border-border p-4 rounded-md bg-surface mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">
          {task.title}
        </h2>
        <p className="text-sm text-text-muted">
          Submitted by {submission?.author?.display_name || "Unknown"}
        </p>
        {submission?.note && (
          <p className="text-sm text-text mt-2">{submission.note}</p>
        )}
        {submission?.links && submission.links.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-text-muted mb-1">Links:</p>
            <ul className="text-xs text-accent list-disc list-inside space-y-1">
              {submission.links.map((link, i) => (
                <li key={i}>
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {submission?.file_paths && submission.file_paths.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-text-muted mb-1">Files:</p>
            <ul className="text-xs text-accent list-disc list-inside space-y-1">
              {submission.file_paths.map((fp: string, i: number) => (
                <li key={i}>
                  <a
                    href={`/api/files/${encodeURIComponent(fp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {fp.split("/").pop()}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(isTrainer || isManager) && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-text mb-3">Review</h2>
          <form
            action={submitReview}
            className="space-y-4"
            method="POST"
          >
            <input type="hidden" name="submission_id" value={submission.id} />

            <div>
              <label
                htmlFor="outcome"
                className="block text-sm font-medium text-text"
              >
                Decision
              </label>
              <select
                id="outcome"
                name="outcome"
                required
                className="block w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="approved">Approve</option>
                <option value="changes_requested">Request Changes</option>
                <option value="rejected">Reject</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="score"
                className="block text-sm font-medium text-text"
              >
                Score (0-100)
              </label>
              <Input
                id="score"
                name="score"
                type="number"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label
                htmlFor="rubric_scores"
                className="block text-sm font-medium text-text"
              >
                Rubric Scores (JSON)
              </label>
              <Input
                id="rubric_scores"
                name="rubric_scores"
                type="text"
                placeholder='{"criteria1": 8, "criteria2": 7}'
              />
            </div>

            <div>
              <label
                htmlFor="comments"
                className="block text-sm font-medium text-text"
              >
                Comments
              </label>
              <Input
                id="comments"
                name="comments"
                placeholder="Your review comments"
              />
            </div>

            <Button type="submit" className="w-full">
              Submit Review
            </Button>
          </form>
        </div>
      )}

      {isAuthor && existingReview && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-text mb-3">Review Result</h2>
          <div className="border border-border p-4 rounded-md bg-surface">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${OUTCOME_BADGE[existingReview.outcome] || "bg-zinc-100 text-zinc-700"}`}>
                {OUTCOME_LABELS[existingReview.outcome] || existingReview.outcome}
              </span>
              {existingReview.score !== null && (
                <span className="text-xs font-medium text-text-muted">
                  Score: {existingReview.score}
                </span>
              )}
            </div>
            {existingReview.comments && (
              <p className="text-sm text-text mt-2">
                {existingReview.comments}
              </p>
            )}
            {existingReview.rubric_scores && (
              <div className="mt-2">
                <p className="text-xs text-text-muted">Rubric Scores:</p>
                <pre className="text-xs text-zinc-500 bg-zinc-100 p-2 rounded">
                  {JSON.stringify(existingReview.rubric_scores, null, 2)}
                </pre>
              </div>
            )}
            {!existingReview.disputed && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-text-muted mb-2">
                  Dispute this review
                </h3>
                <form
                  action={disputeReview}
                  className="space-y-3"
                  method="POST"
                >
                  <input type="hidden" name="review_id" value={existingReview.id} />
                  <Input
                    id="dispute_note"
                    name="dispute_note"
                    placeholder="Why are you disputing this review?"
                    required
                  />
                  <Button type="submit" size="sm">
                    File Dispute
                  </Button>
                </form>
              </div>
            )}

            {existingReview.disputed && (
              <div className="mt-4 p-3 border border-amber-100 bg-amber-100 rounded-md text-sm text-amber-700">
                <p className="font-medium">Dispute filed.</p>
                <p className="text-text-muted">
                  A trainer will review your dispute and make a final decision.
                </p>
                {existingReview.dispute_note && (
                  <p className="text-sm text-text mt-2">
                    <span className="font-medium">Your note:</span>{" "}
                    {existingReview.dispute_note}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
