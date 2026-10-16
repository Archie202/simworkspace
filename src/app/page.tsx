import ShellLayout from "@/components/shell/ShellLayout";

export default function Home() {
  return (
    <ShellLayout>
      <div>
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
        <p className="mt-2 text-sm text-text-muted">
          Welcome to your internship workspace. This is the home page.
        </p>
      </div>
    </ShellLayout>
  );
}
