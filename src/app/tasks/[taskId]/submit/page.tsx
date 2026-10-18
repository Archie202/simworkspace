import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { submitTask } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function SubmitTaskPage({
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

  // Get the task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*, creator:profiles!created_by(display_name)")
    .eq("id", params.taskId)
    .single();

  if (taskError || !task) {
    redirect("/not-allowed");
  }

  // Verify user is the assignee
  if (task.assignee_id !== user.id) {
    redirect("/not-allowed");
  }

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let errorMessage: string | undefined;
  if (error === "upload_failed") {
    errorMessage = "File upload failed. Please try again.";
  } else if (error === "submit_failed") {
    errorMessage = "Submission failed. Please try again.";
  } else if (error === "task_update_failed") {
    errorMessage = "Task status update failed. Please try again.";
  }

  let successMessage: string | undefined;
  if (success === "submitted") {
    successMessage = "Task submitted successfully.";
  }

  // Get existing submissions
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, author:profiles!author_id(display_name)")
    .eq("task_id", params.taskId)
    .order("version", { ascending: false });

  // Load draft from localStorage (handled client-side)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Submit Task</h1>
          <p className="text-sm text-text-muted">
            Submit your work for review.
          </p>
        </div>
        <a
          href={`/tasks/${params.taskId}`}
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent-hover focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Back to Task
        </a>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="border border-border p-4 rounded-md bg-surface mb-6">
        <h2 className="text-sm font-semibold text-text mb-3">
          {task.title}
        </h2>
        {task.description && (
          <p className="text-sm text-text-muted mb-3">{task.description}</p>
        )}
        <p className="text-xs text-text-muted">
          Created by {task.creator?.display_name || "Unknown"}
        </p>
      </div>

      <form
        action={submitTask}
        className="space-y-4"
        method="POST"
      >
        <input type="hidden" name="task_id" value={params.taskId} />

        <div>
          <label
            htmlFor="links"
            className="block text-sm font-medium text-text"
          >
            Links (comma-separated)
          </label>
          <Input
            id="links"
            name="links"
            type="text"
            placeholder="https://example.com, https://example.org"
          />
          <p className="text-xs text-text-muted mt-1">
            Comma-separated URLs for your submission.
          </p>
        </div>

        <div>
          <label
            htmlFor="files"
            className="block text-sm font-medium text-text"
          >
            Files (up to 10 MB each)
          </label>
          <input
            id="files"
            name="files"
            type="file"
            multiple
            className="mt-1 block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-hover hover:file:bg-accent/90"
          />
          <p className="text-xs text-text-muted mt-1">
            PDF, DOCX, images, and other common file types.
          </p>
        </div>

        <div>
          <label
            htmlFor="note"
            className="block text-sm font-medium text-text"
          >
            Note (optional)
          </label>
          <Input
            id="note"
            name="note"
            type="text"
            placeholder="Any notes for the reviewer"
          />
        </div>

        <Button type="submit" className="w-full">
          Submit for Review
        </Button>
      </form>

      {submissions && submissions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-text mb-3">Submissions</h2>
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div
                key={`${sub.task_id}-v${sub.version}`}
                className="border border-border p-3 rounded-md bg-surface"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      Version {sub.version}
                    </h3>
                    <p className="text-xs text-text-muted">
                      Submitted by {sub.author?.display_name || "Unknown"} on{" "}
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-text-muted">
                    v{sub.version}
                  </span>
                </div>
                {sub.note && (
                  <p className="text-sm text-text mt-2">{sub.note}</p>
                )}
                {sub.links && sub.links.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-text-muted mb-1">Links:</p>
                    <ul className="text-xs text-accent list-disc list-inside space-y-1">
                      {sub.links.map((link, i) => (
                        <li key={i}>
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {sub.file_paths && sub.file_paths.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-text-muted mb-1">Files:</p>
                    <ul className="text-xs text-accent list-disc list-inside space-y-1">
                      {sub.file_paths.map((fp, i) => (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
