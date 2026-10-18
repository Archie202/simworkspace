import ShellLayout from "@/components/shell/ShellLayout";

export default function DashboardPage() {
  return (
    <ShellLayout>
      <div>
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
        <p className="mt-2 text-sm text-text-muted">
          Welcome to your workspace. Select an option from the navigation to get started.
        </p>
      </div>
    </ShellLayout>
  );
}
