import TopBar from "./TopBar";
import LeftNav from "./LeftNav";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen max-w-none">
      <TopBar />
      <div className="flex-1 flex flex-col md:flex-row max-w-none">
        <aside className="w-full md:w-[200px] shrink-0 border-r border-border bg-surface">
          <LeftNav />
        </aside>
        <main className="flex-1 overflow-y-auto bg-bg p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
