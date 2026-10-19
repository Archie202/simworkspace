import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createRubric, updateRubric } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function RubricsPage({
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
    .select("id, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Verify user is a trainer
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

  // Get all rubrics for the organization
  const { data: rubrics } = await supabase
    .from("rubrics")
    .select("*, creator:profiles!created_by(display_name)")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let statusMessage: string | undefined;
  if (success === "created") {
    statusMessage = "Rubric created successfully.";
  } else if (success === "updated") {
    statusMessage = "Rubric updated successfully.";
  } else if (error === "invalid_rubric") {
    statusMessage = "Invalid rubric data. Please try again.";
  } else if (error === "invalid_criteria_json") {
    statusMessage = "Criteria must be valid JSON.";
  } else if (error === "create_failed") {
    statusMessage = "Failed to create rubric. Please try again.";
  } else if (error === "update_failed") {
    statusMessage = "Failed to update rubric. Please try again.";
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Rubric Library</h1>
          <p className="text-sm text-text-muted">
            Create and manage scoring rubrics for interviews, tasks,
            reviews, and scenarios.
          </p>
        </div>
        <a href="#create-rubric" className="Button">
          Create Rubric
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

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">Rubrics</h2>
        {rubrics && rubrics.length > 0 ? (
          <div className="space-y-3">
            {rubrics.map((r) => (
              <div
                key={r.id}
                className="border border-border p-4 rounded-md bg-surface"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      {r.name}
                    </h3>
                    <p className="text-xs text-text-muted">
                      Kind: {r.kind} • Created by {r.creator?.display_name || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-text-muted mb-1">Criteria:</p>
                  <pre className="text-xs text-zinc-500 bg-zinc-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(r.criteria, null, 2)}
                  </pre>
                </div>
                <form
                  action={updateRubric}
                  className="mt-4 space-y-3"
                  method="POST"
                >
                  <input type="hidden" name="rubric_id" value={r.id} />
                  <div>
                    <label
                      htmlFor={`name-${r.id}`}
                      className="block text-xs font-medium text-text-muted"
                    >
                      Name
                    </label>
                    <Input
                      id={`name-${r.id}`}
                      name="name"
                      defaultValue={r.name}
                      className="w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`kind-${r.id}`}
                      className="block text-xs font-medium text-text-muted"
                    >
                      Kind
                    </label>
                    <select
                      id={`kind-${r.id}`}
                      name="kind"
                      defaultValue={r.kind}
                      className="block w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="interview">Interview</option>
                      <option value="task">Task</option>
                      <option value="review">Review</option>
                      <option value="scenario">Scenario</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor={`criteria-${r.id}`}
                      className="block text-xs font-medium text-text-muted"
                    >
                      Criteria (JSON)
                    </label>
                    <Input
                      id={`criteria-${r.id}`}
                      name="criteria"
                      type="text"
                      defaultValue={JSON.stringify(r.criteria, null, 2)}
                      className="w-full min-h-[64px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Button type="submit">Update Rubric</Button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No rubrics defined yet. Create one below.
          </p>
        )}

        <div id="create-rubric" className="mt-8">
          <h2 className="text-sm font-semibold text-text mb-3">Create Rubric</h2>
          <form
            action={createRubric}
            className="space-y-4 max-w-md"
            method="POST"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text"
              >
                Name
              </label>
              <Input id="name" name="name" placeholder="Rubric name" required />
            </div>

            <div>
              <label
                htmlFor="kind"
                className="block text-sm font-medium text-text"
              >
                Kind
              </label>
              <select
                id="kind"
                name="kind"
                defaultValue="task"
                className="block w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="interview">Interview</option>
                <option value="task">Task</option>
                <option value="review">Review</option>
                <option value="scenario">Scenario</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="criteria"
                className="block text-sm font-medium text-text"
              >
                Criteria (JSON)
              </label>
              <Input
                id="criteria"
                name="criteria"
                type="text"
                placeholder='[{"name": "Criteria 1", "weight": 1, "descriptors": {}}]'
                required
              />
            </div>

            <Button type="submit">Create Rubric</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
