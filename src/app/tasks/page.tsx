import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createTask, moveTaskToNext, reopenTask } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  in_review: "In review",
  changes_requested: "Changes requested",
  done: "Done",
};

export default async function TasksPage({
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
    .select("id, display_name, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  const { data: member } = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .single();

  if (!member) {
    redirect("/not-allowed");
  }

  const { data: companyMembers } = await supabase
    .from("company_members")
    .select("company_id, function")
    .eq("profile_id", user.id)
    .is("ended_at", null);

  const companyIds = companyMembers
    ?.map((cm) => cm.company_id)
    .filter((id): id is string => id !== null && id !== undefined) ?? [];

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", profile.organization_id!)

  const isTrainer =
    userRoles?.some((r) => r.role === "trainer") ||
    userRoles?.some((r) => r.role === "school_admin");

  const canCreateTask =
    isTrainer ||
    companyMembers?.some(
      (cm) => cm.function === "manager" || cm.function === "hr"
    ) ||
    false;

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      "*, assignee:profiles!assignee_id(display_name), creator:profiles!created_by(display_name)"
    )
    .in("company_id", companyIds)
    .order("status", { ascending: true })
    .order("position", { ascending: true });

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let statusMessage: string | undefined;
  if (success === "task_created") {
    statusMessage = "Task created successfully.";
  } else if (success === "task_updated") {
    statusMessage = "Task status updated.";
  } else if (error === "invalid_status_move") {
    statusMessage = "You cannot move a task to that status.";
  }

  const statuses = ["todo", "in_progress", "in_review", "changes_requested", "done"];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Task Board</h1>
          <p className="text-sm text-text-muted">
            Kanban board for your company tasks.
          </p>
        </div>
        {canCreateTask && (
          <Button
            onClick={() => {
              // Create task form is displayed below
            }}
          >
            Create Task
          </Button>
        )}
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

      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => {
          const statusTasks = (tasks ?? []).filter((t) => t.status === status);
          return (
            <div
              key={status}
              className="flex flex-col w-[300px] min-w-[300px]"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-text">
                  {STATUS_LABELS[status]}
                </h2>
                <Badge variant="outline" className="text-xs">
                  {statusTasks.length}
                </Badge>
              </div>
              <div
                className="flex flex-col gap-2 min-h-[400px] bg-zinc-50 rounded-lg p-2"
              >
                {statusTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border border-zinc-200 rounded-md p-3 mb-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {}}
                  >
                    <h3 className="text-sm font-medium text-text truncate">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-zinc-500 mt-1 truncate">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {task.assignee && (
                        <span className="text-xs text-zinc-600">
                          {task.assignee.display_name}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {status !== "done" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const formData = new FormData();
                            formData.append("task_id", task.id);
                            moveTaskToNext(formData);
                          }}
                        >
                          Next
                        </Button>
                      )}
                      {status === "done" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const formData = new FormData();
                            formData.append("task_id", task.id);
                            reopenTask(formData);
                          }}
                        >
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text mb-3">Create Task</h2>
        <form
          action={createTask}
          className="max-w-md space-y-4"
          method="POST"
        >
          <input type="hidden" name="company_id" value={companyIds[0] || ""} />
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
                htmlFor="priority"
                className="block text-sm font-medium text-text"
              >
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue="medium"
                className="block w-full min-h-[44px] rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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
              </select>
            </div>
          </div>
          <Button type="submit">Create Task</Button>
        </form>
      </div>
    </div>
  );
}
