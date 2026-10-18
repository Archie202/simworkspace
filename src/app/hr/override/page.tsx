import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { overrideDecision, placeIntern } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  screening: "Screening",
  interview: "Interview",
  offered: "Offered",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default async function OverridePage({
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

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Verify user has permission (trainer or school admin)
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

  // Get user's company memberships
  const { data: companyMembers } = await supabase
    .from("company_members")
    .select("company_id, function")
    .eq("profile_id", user.id);

  const companyIds = companyMembers?.map((cm) => cm.company_id) ?? [];

  // Get applications with offers or that can be overridden/placed
  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, status, attempt_number, override_reason, overridden_by, created_at, applicants:profiles!applicant_id(full_name, display_name, date_of_birth), job_postings!inner(title, company_id, companies!inner(name))"
    )
    .in("company_id", companyIds)
    .in("status", ["offered", "accepted", "rejected"])
    .order("created_at", { ascending: false });

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let statusMessage: string | undefined;
  if (success === "override_done") {
    statusMessage = "Decision overridden successfully.";
  } else if (success === "placement_done") {
    statusMessage = "Intern placed successfully.";
  } else if (error === "override_failed") {
    statusMessage = "Failed to override decision. Please try again.";
  } else if (error === "place_failed") {
    statusMessage = "Failed to place intern. Please try again.";
  } else if (error === "validation_failed") {
    statusMessage = "Override reason is required.";
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">Trainer Override & Placement</h1>
      <p className="mt-2 text-sm text-text-muted">
        Override hiring decisions or directly place interns.
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
                      {app.overridden_by && (
                        <span className="ml-2 text-xs font-medium text-text-muted">
                          Previously overridden
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-text-muted">
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm text-text-muted">
                      Attempt {app.attempt_number} of 2
                    </div>

                    <div className="bg-surface border border-border p-3 rounded-md">
                      <h4 className="text-xs font-semibold text-text mb-2">
                        Override Decision
                      </h4>
                      <form
                        action={overrideDecision}
                        className="space-y-2"
                        method="POST"
                      >
                        <input
                          type="hidden"
                          name="application_id"
                          value={app.id}
                        />
                        <Input
                          id={`override_reason-${app.id}`}
                          name="override_reason"
                          placeholder="Reason for override"
                          required
                          className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />
                        <Button type="submit" className="w-full">
                          Override Decision
                        </Button>
                      </form>
                    </div>

                    <div className="bg-surface border border-border p-3 rounded-md">
                      <h4 className="text-xs font-semibold text-text mb-2">
                        Direct Placement
                      </h4>
                      <p className="text-xs text-text-muted mb-2">
                        Place this intern directly into the company without
                        going through the normal offer process.
                      </p>
                      <form
                        action={placeIntern}
                        className="space-y-2"
                        method="POST"
                      >
                        <input
                          type="hidden"
                          name="application_id"
                          value={app.id}
                        />
                        <Button type="submit" variant="outline">
                          Place Intern
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No applications available for override or placement.
          </p>
        )}
      </div>
    </div>
  );
}
