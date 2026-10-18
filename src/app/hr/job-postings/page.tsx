import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createJobPosting } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function JobPostingsPage({
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

  // Get companies in the user's organization where they have HR/manager function
  const { data: companyMembers } = await supabase
    .from("company_members")
    .select(
      "company_id, function, companies!inner(name, cohort_id, organization_id)"
    )
    .eq("profile_id", user.id)
    .eq("companies.organization_id", profile.organization_id);

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  return (
    <div>
      <h1 className="text-xl font-semibold text-text">Job Postings</h1>
      <p className="mt-2 text-sm text-text-muted">
        Create and manage job postings for your companies.
      </p>

      {success === "created" && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          Job posting created.
        </div>
      )}
      {success === "updated" && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          Job posting updated.
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive">
          Something went wrong. Please try again.
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">Create Posting</h2>
        <form
          action={createJobPosting}
          className="space-y-4 max-w-md"
          method="POST"
        >
          <div>
            <label
              htmlFor="company_id"
              className="block text-sm font-medium text-text"
            >
              Company
            </label>
            <select
              id="company_id"
              name="company_id"
              required
              className="block w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select a company</option>
              {companyMembers?.map((cm) => (
                <option key={cm.company_id} value={cm.company_id}>
                  {cm.companies.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text">
              Title
            </label>
            <Input id="title" name="title" placeholder="Junior Developer" required />
          </div>

          <div>
            <label
              htmlFor="function"
              className="block text-sm font-medium text-text"
            >
              Function
            </label>
            <select
              id="function"
              name="function"
              required
              className="block w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="intern">Intern</option>
              <option value="hr">HR Intern</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="track"
              className="block text-sm font-medium text-text"
            >
              Track
            </label>
            <select
              id="track"
              name="track"
              required
              className="block w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="software_development">Software Development</option>
              <option value="data_analytics">Data Analytics</option>
              <option value="program_management">Program Management</option>
              <option value="hr">HR</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-text"
            >
              Description
            </label>
            <Input
              id="description"
              name="description"
              placeholder="What will the intern do?"
              required
            />
          </div>

          <div>
            <label
              htmlFor="requirements"
              className="block text-sm font-medium text-text"
            >
              Requirements (optional)
            </label>
            <Input
              id="requirements"
              name="requirements"
              placeholder="What skills are needed?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="openings"
                className="block text-sm font-medium text-text"
              >
                Openings
              </label>
              <Input
                id="openings"
                name="openings"
                type="number"
                defaultValue="1"
                required
              />
            </div>
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-text"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                required
                className="block w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="draft">Draft</option>
                <option value="open">Open</option>
              </select>
            </div>
          </div>

          <Button type="submit">Create Posting</Button>
        </form>
      </div>
    </div>
  );
}
