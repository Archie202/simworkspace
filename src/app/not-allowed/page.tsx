import ShellLayout from "@/components/shell/ShellLayout";

export default function NotAllowedPage() {
  return (
    <ShellLayout>
      <div className="max-w-md">
        <h1 className="text-xl font-semibold text-text">Not allowed</h1>
        <p className="mt-2 text-sm text-text-muted">
          You don&rsquo;t have permission to view this page. If you believe this is
          an error, please contact your trainer or school admin.
        </p>
      </div>
    </ShellLayout>
  );
}
