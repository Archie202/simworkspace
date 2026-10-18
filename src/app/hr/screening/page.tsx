import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { advanceApplication } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  screening: "Screening",
  interview: "Interview",
  offered: "Offered",
  accepted: "Accepted",
  rejected: "Not successful",
  withdrawn: "Withdrawn",
};

const STATUS_BADGE_VARIANT: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  submitted: "outline",
  screening: "outline",
  interview: "outline",
  offered: "default",
  accepted: "default",
  rejected: "outline",
  withdrawn: "outline",
};

function getBadgeVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
  return STATUS_BADGE_VARIANT[status] || "outline";
}

export default async function ScreeningPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's organization and company memberships
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  const { data: companyMembers } = await supabase
    .from("company_members")
    .select("company_id, function")
    .eq("profile_id", user.id);

  const isTrainerOrAdmin =
    (await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", profile.organization_id))?.data?.some(
      (r) => r.role === "trainer" || r.role === "school_admin"
    ) || false;

  const companyIds = companyMembers
    ?.filter(
      (cm) =>
        cm.function === "hr" ||
        cm.function === "manager" ||
        isTrainerOrAdmin
    )
    .map((cm) => cm.company_id);

  if (!companyIds || companyIds.length === 0) {
    redirect("/not-allowed");
  }

  // Get applications for the user's companies
  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, applicant_id, job_posting_id, status, attempt_number, cover_note, cv_path, feedback_to_applicant, created_at, applicants:profiles!applicant_id(full_name, display_name, date_of_birth), job_postings!inner(title, company_id, companies!inner(name))"
    )
    .in("company_id", companyIds)
    .order("created_at", { ascending: false });

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let statusMessage: string | undefined;
  if (success === "application_offered") {
    statusMessage = "Application advanced to interview stage.";
  } else if (success === "application_rejected") {
    statusMessage = "Application rejected with feedback.";
  } else if (success === "application_accepted") {
    statusMessage = "Offer made to applicant.";
  } else if (success === "application_screening") {
    statusMessage = "Application moved to screening.";
  } else if (error === "rejection_requires_feedback") {
    statusMessage = "Rejection requires written feedback.";
  } else if (error === "advance_failed") {
    statusMessage = "Failed to update application. Please try again.";
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">HR Screening</h1>
      <p className="mt-2 text-sm text-text-muted">
        Review applications and advance or reject candidates.
      </p>

      {statusMessage && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          {statusMessage}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">Applications</h2>
        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => {
              const applicant = app.applicants as {
                full_name: string;
                display_name: string;
                date_of_birth: string | null;
              } | null;
              const jobPosting = app.job_postings as {
                title: string;
                company_id: string;
                companies: { name: string };
              };
              const isMinor =
                applicant?.date_of_birth &&
                new Date().getFullYear() -
                  new Date(applicant.date_of_birth).getFullYear() <
                  18;

              return (
                <div
                  key={app.id}
                  className="border border-border p-4 rounded-md bg-surface"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-text">
                        {applicant?.display_name || "Unknown applicant"}
                      </h3>
                      <p className="text-xs text-text-muted">
                        {jobPosting.companies.name} •
                        {jobPosting.title}
                      </p>
                      {isMinor && (
                        <span className="ml-2 text-xs font-medium text-text-muted">
                          Under 18
                        </span>
                      )}
                    </div>
                    <Badge variant={getBadgeVariant(app.status)}>
                      {STATUS_LABELS[app.status] || app.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {app.cover_note && (
                      <div className="text-sm text-text">
                        <p className="font-semibold text-xs text-text-muted mb-1">
                          Cover note
                        </p>
                        <p>{app.cover_note}</p>
                      </div>
                    )}

                    <form
                      action={advanceApplication}
                      className="space-y-3"
                      method="POST"
                    >
                      <input
                        type="hidden"
                        name="application_id"
                        value={app.id}
                      />

                      <div>
                        <label
                          htmlFor={`status-${app.id}`}
                          className="block text-xs font-medium text-text-muted"
                        >
                          Next status
                        </label>
                        <select
                          id={`status-${app.id}`}
                          name="status"
                          defaultValue={app.status}
                          className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          {app.status === "submitted" && (
                            <>
                              <option value="screening">Screening</option>
                              <option value="rejected">Reject</option>
                            </>
                          )}
                          {app.status === "screening" && (
                            <>
                              <option value="interview">Interview</option>
                              <option value="rejected">Reject</option>
                            </>
                          )}
                          {app.status === "interview" && (
                            <>
                              <option value="offered">Make offer</option>
                              <option value="rejected">Reject</option>
                            </>
                          )}
                          {app.status === "offered" && (
                            <>
                              <option value="accepted">Accept offer</option>
                              <option value="rejected">Reject</option>
                            </>
                          )}
                        </select>
                      </div>

                      {app.status === "rejected" || app.status === "offered" ? (
                        <div>
                          <label
                            htmlFor={`feedback-${app.id}`}
                            className="block text-xs font-medium text-text-muted"
                          >
                            Feedback to applicant
                          </label>
                          <Input
                            id={`feedback-${app.id}`}
                            name="feedback_to_applicant"
                            placeholder="Written feedback (required for rejection)"
                            defaultValue={app.feedback_to_applicant || ""}
                          />
                        </div>
                      ) : (
                        <div>
                          <label
                            htmlFor={`score-${app.id}`}
                            className="block text-xs font-medium text-text-muted"
                          >
                            Screening score (0-100)
                          </label>
                          <Input
                            id={`score-${app.id}`}
                            name="screening_score"
                            type="number"
                            min="0"
                            max="100"
                            className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor={`notes-${app.id}`}
                          className="block text-xs font-medium text-text-muted"
                        >
                          Staff notes (private)
                        </label>
                        <Input
                          id={`notes-${app.id}`}
                          name="staff_notes"
                          placeholder="Private staff notes"
                          className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={
                          app.status === "accepted" ||
                          app.status === "rejected" ||
                          app.status === "withdrawn"
                        }
                      >
                        {app.status === "rejected" || app.status === "offered"
                          ? "Update"
                          : "Update status"}
                      </Button>
                    </form>

                    {app.feedback_to_applicant && (
                      <div className="text-sm text-text-muted">
                        <p className="font-semibold text-xs mb-1">
                          Feedback to applicant
                        </p>
                        <p>{app.feedback_to_applicant}</p>
                      </div>
                    )}

                    <div className="text-xs text-text-muted">
                      Attempt {app.attempt_number} of 2
                    </div>

                    <div className="text-xs text-text-muted">
                      CV:
                      <a
                        href="/cv-preview"
                        className="text-accent hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download CV
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No applications to review for your companies.
          </p>
        )}
      </div>
    </div>
  );
}
