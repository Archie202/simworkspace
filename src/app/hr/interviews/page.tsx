import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { scheduleInterview } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function InterviewsPage({
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
    .select("organization_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Get user's company memberships
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

  // Get applications at interview stage or submitted (ready for interview)
  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, status, attempt_number, created_at, applicants:profiles!applicant_id(full_name, display_name, date_of_birth), job_postings!inner(title, company_id, companies!inner(name))"
    )
    .in("company_id", companyIds)
    .in("status", ["submitted", "screening", "interview"])
    .order("created_at", { ascending: false });

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let statusMessage: string | undefined;
  if (success === "interview_scheduled") {
    statusMessage = "Interview scheduled successfully.";
  } else if (error === "second_adult_required") {
    statusMessage = "An under-18 applicant requires a second adult at the interview.";
  } else if (error === "schedule_failed") {
    statusMessage = "Failed to schedule interview. Please try again.";
  } else if (error === "validation_failed") {
    statusMessage = "Invalid interview data. Please check your inputs.";
  } else if (error === "update_failed") {
    statusMessage = "Failed to update application status.";
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">Interviews</h1>
      <p className="mt-2 text-sm text-text-muted">
        Schedule interviews for applicants.
      </p>

      {statusMessage && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          {statusMessage}
        </div>
      )}

      {error && error !== "second_adult_required" && error !== "schedule_failed" && error !== "validation_failed" && error !== "update_failed" && (
        <div className="mt-4 p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive">
          Something went wrong. Please try again.
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">Schedule Interview</h2>
        <form
          action={scheduleInterview}
          className="space-y-4 max-w-md"
          method="POST"
        >
          <div>
            <label
              htmlFor="application_id"
              className="block text-sm font-medium text-text"
            >
              Applicant
            </label>
            <select
              id="application_id"
              name="application_id"
              required
              className="block w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select an applicant</option>
              {applications?.map((app) => {
                const applicant = app.applicants as {
                  full_name: string;
                  display_name: string;
                  date_of_birth: string | null;
                } | null;
                const isMinor =
                  applicant?.date_of_birth &&
                  new Date().getFullYear() -
                    new Date(applicant.date_of_birth).getFullYear() <
                    18;
                return (
                  <option
                    key={app.id}
                    value={app.id}
                  >
                    {applicant?.display_name || "Unknown"} — {app.job_postings.title} {isMinor ? "(under 18)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label
              htmlFor="interviewer_id"
              className="block text-sm font-medium text-text"
            >
              Interviewer
            </label>
            <select
              id="interviewer_id"
              name="interviewer_id"
              required
              className="block w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select interviewer</option>
              <option value={user.id}>{profile.display_name || "You"}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="second_adult_id"
              className="block text-sm font-medium text-text"
            >
              Second adult (required for under-18 applicants)
            </label>
            <select
              id="second_adult_id"
              name="second_adult_id"
              className="block w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">None</option>
              <option value={user.id}>{profile.display_name || "You"}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="mode"
                className="block text-sm font-medium text-text"
              >
                Mode
              </label>
              <select
                id="mode"
                name="mode"
                defaultValue="audio"
                className="block w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="audio">Audio call</option>
                <option value="video">Video call</option>
                <option value="chat">Chat</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="duration_minutes"
                className="block text-sm font-medium text-text"
              >
                Duration (minutes)
              </label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                defaultValue="30"
                min="15"
                max="480"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="scheduled_at"
              className="block text-sm font-medium text-text"
            >
              Date and time
            </label>
            <Input
              id="scheduled_at"
              name="scheduled_at"
              type="datetime-local"
              required
            />
          </div>

          <div>
            <label
              htmlFor="meeting_url"
              className="block text-sm font-medium text-text"
            >
              Call link (external)
            </label>
            <Input
              id="meeting_url"
              name="meeting_url"
              type="url"
              placeholder="https://example.com/call"
            />
          </div>

          <Button type="submit">Schedule Interview</Button>
        </form>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">Upcoming Interviews</h2>
        <p className="text-sm text-text-muted">
          Interview management coming in the next task.
        </p>
      </div>
    </div>
  );
}
