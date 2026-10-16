export default function TopBar() {
  return (
    <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-text tracking-tight">
          Virtual Workplace
        </span>
      </div>
      <div className="flex items-center gap-4">
        <a
          href="/report-concern"
          className="text-sm text-text-muted hover:text-accent underline underline-offset-4 focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Report a concern
        </a>
      </div>
    </header>
  );
}
