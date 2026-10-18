"use client";

import { useFormStatus } from "react-dom";
import { submitApplication } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Submitting…" : "Submit Application"}
    </Button>
  );
}

interface ApplyFormProps {
  posting: {
    id: string;
    title: string;
    function: string;
    track: string;
    description: string;
    requirements: string | null;
    openings: number;
    company_name: string;
  };
  error: string | undefined;
  success: string | undefined;
}

export default function ApplyForm({
  posting,
  error,
  success,
}: ApplyFormProps) {
  let errorMessage: string | undefined;
  if (error === "account_not_active") {
    errorMessage =
      "Your account is not active. Please complete onboarding before applying.";
  } else if (error === "posting_not_open") {
    errorMessage = "This position is no longer open for applications.";
  } else if (error === "max_attempts") {
    errorMessage =
      "You have already applied to this position twice. Please contact your trainer.";
  } else if (error === "upload_failed") {
    errorMessage = "CV upload failed. Please try again.";
  } else if (error === "submit_failed") {
    errorMessage = "Application submission failed. Please try again.";
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">Apply for a Role</h1>
      <p className="mt-2 text-sm text-text-muted">
        Submit your application for {posting.title}.
      </p>

      {success === "application_submitted" && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          Your application has been submitted successfully.
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="mt-6">
        <div className="border border-border p-4 rounded-md bg-surface mb-6">
          <h2 className="text-sm font-semibold text-text mb-2">
            {posting.title}
          </h2>
          <p className="text-xs text-text-muted">
            {posting.company_name} • {posting.track.replace("_", " ")} •
            {posting.function}
          </p>
          <p className="text-sm text-text mt-2">{posting.description}</p>
          {posting.requirements && (
            <p className="text-sm text-text mt-2">
              <span className="font-semibold">Requirements:</span>{" "}
              {posting.requirements}
            </p>
          )}
          <p className="text-xs text-text-muted mt-2">
            Openings: {posting.openings}
          </p>
        </div>

        <form
          action={submitApplication}
          encType="multipart/form-data"
          method="POST"
          className="space-y-4"
        >
          <input type="hidden" name="posting_id" value={posting.id} />

          <div>
            <label
              htmlFor="cv"
              className="block text-sm font-medium text-text"
            >
              CV (PDF or DOCX, max 2 MB)
            </label>
            <input
              id="cv"
              name="cv"
              type="file"
              accept=".pdf,.docx"
              required
              className="mt-1 block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-hover hover:file:bg-accent/90"
            />
          </div>

          <div>
            <label
              htmlFor="cover_note"
              className="block text-sm font-medium text-text"
            >
              Cover note (optional)
            </label>
            <Input
              id="cover_note"
              name="cover_note"
              type="text"
              placeholder="Why are you interested in this role?"
            />
          </div>

          <div className="pt-4">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
