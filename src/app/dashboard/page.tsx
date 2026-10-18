import ShellLayout from "@/components/shell/ShellLayout";
import { getUserContext, getUserRole } from "@/lib/auth/server";

export default async function DashboardPage() {
  const context = await getUserContext();
  const role = getUserRole(context);

  if (!role) {
    return (
      <ShellLayout>
        <div>
          <h1 className="text-xl font-semibold text-text">Dashboard</h1>
          <p className="mt-2 text-sm text-text-muted">
            Your account has been created but is not yet active.
          </p>
          <div className="mt-4 p-3 border border-accent bg-accent/10 rounded-md text-sm">
            <p className="font-medium text-text">Pending verification</p>
            <p className="text-text-muted">
              A trainer or school admin needs to verify your role and assign
              you to a cohort or company before you can access the workspace.
            </p>
          </div>
          <p className="mt-4 text-sm text-text-muted">
            If you are under 18, your account will also require guardian
            consent before it can be activated.
          </p>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <div>
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
        <p className="mt-2 text-sm text-text-muted">
          Welcome to your workspace. Select an option from the navigation to
          get started.
        </p>
      </div>
    </ShellLayout>
  );
}
