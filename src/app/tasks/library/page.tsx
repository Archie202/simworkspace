import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createTaskTemplate, createTaskFromTemplate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const TRACK_LABELS: Record<string, string> = {
  software_development: "Software Development",
  data_analytics: "Data Analytics",
  program_management: "Program Management",
  hr: "HR",
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

export default async function TaskLibraryPage({
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

  // Get rubrics for the organization
  const { data: rubrics } = await supabase
    .from("rubrics")
    .select("id, name")
    .eq("organization_id", profile.organization_id)
    .order("name", { ascending: true });

  // Get task templates for the organization
  const { data: templates } = await supabase
    .from("task_templates")
    .select("*, creator:profiles!created_by(display_name)")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  // Get companies in the org for task creation
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .eq("organization_id", profile.organization_id)
    .order("name", { ascending: true });

  // Get cohort members for assignee options
  const { data: cohortMembers } = await supabase
    .from("cohort_members")
    .select(
      "profile_id, profiles!inner(display_name)"
    )
    .eq("status", "active")
    .eq("organization_id", profile.organization_id);

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let statusMessage: string | undefined;
  if (success === "created") {
    statusMessage = "Template created successfully.";
  } else if (success === "template_created") {
    statusMessage = "Task created from template successfully.";
  } else if (error === "invalid_template") {
    statusMessage = "Invalid template data. Please try again.";
  } else if (error === "create_failed") {
    statusMessage = "Failed to create template. Please try again.";
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Task Library</h1>
          <p className="text-sm text-text-muted">
            Create and manage task templates per track.
          </p>
        </div>
        <a href="#create-template" className="Button">
          Create Template
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
        <h2 className="text-sm font-semibold text-text mb-3">Task Templates</h2>
        {templates && templates.length > 0 ? (
          <div className="space-y-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className="border border-border p-4 rounded-md bg-surface"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      {t.title}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {TRACK_LABELS[t.track] || t.track} •
                      Difficulty: {DIFFICULTY_LABELS[t.difficulty]} •
                      Created by {t.creator?.display_name || "Unknown"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {t.difficulty}
                  </Badge>
                </div>
                {t.description && (
                  <p className="text-sm text-text-muted mb-2">
                    {t.description}
                  </p>
                )}
                {t.rubric_id && (
                  <p className="text-xs text-text-muted">
                    Rubric: {t.rubric_id}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No templates defined yet. Create one below.
          </p>
        )}
      </div>

      <div id="create-template" className="mt-8">
        <h2 className="text-sm font-semibold text-text mb-3">Create Template</h2>
        <form
          action={createTaskTemplate}
          className="max-w-md space-y-4"
          method="POST"
        >
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
              className="block w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="software_development">Software Development</option>
              <option value="data_analytics">Data Analytics</option>
              <option value="program_management">Program Management</option>
              <option value="hr">HR</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-text"
            >
              Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Task title"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-text"
            >
              Description (optional)
            </label>
            <Input
              id="description"
              name="description"
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-text"
              >
                Difficulty (1-3)
              </label>
              <select
                id="difficulty"
                name="difficulty"
                defaultValue="2"
                className="block w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Easy</option>
                <option value="2">Medium</option>
                <option value="3">Hard</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="estimated_minutes"
                className="block text-sm font-medium text-text"
              >
                Estimated Minutes
              </label>
              <Input
                id="estimated_minutes"
                name="estimated_minutes"
                type="number"
                placeholder="e.g. 60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="rubric_id"
              className="block text-sm font-medium text-text"
            >
              Rubric (optional)
            </label>
            <select
              id="rubric_id"
              name="rubric_id"
              className="block w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {rubrics?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit">Create Template</Button>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text mb-3">Create Task from Template</h2>
        <form
          action={createTaskFromTemplate}
          className="max-w-md space-y-4"
          method="POST"
        >
          <div>
            <label
              htmlFor="template_id"
              className="block text-sm font-medium text-text"
            >
              Template
            </label>
            <select
              id="template_id"
              name="template_id"
              required
              className="block w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a template</option>
              {templates?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({TRACK_LABELS[t.track] || t.track})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-text"
            >
              Title
            </label>
            <Input id="title" name="title" placeholder="Task title" required />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-text"
            >
              Description (optional)
            </label>
            <Input
              id="description"
              name="description"
              placeholder="Task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                className="block w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a company</option>
                {companies?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="assignee_id"
                className="block text-sm font-medium text-text"
              >
                Assignee (optional)
              </label>
              <select
                id="assignee_id"
                name="assignee_id"
                className="block w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {cohortMembers?.map((cm) => (
                  <option key={cm.profile_id} value={cm.profile_id}>
                    {cm.profiles.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="due_at"
              className="block text-sm font-medium text-text"
            >
              Due Date (optional)
            </label>
            <Input id="due_at" name="due_at" type="datetime-local" />
          </div>

          <Button type="submit">Create Task from Template</Button>
        </form>
      </div>
    </div>
  );
}
