import TopBar from "./TopBar";
import LeftNav, { type LeftNavProps } from "./LeftNav";
import { getUserContext, getUserRole, getUserCompany } from "@/lib/auth/server";

export default async function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This runs on the server during SSR. The user context is loaded
  // from the database on every request, never trusted from the browser.
  const context = await getUserContext();
  const role = getUserRole(context);
  const company = getUserCompany(context);

  const navProps: LeftNavProps = {
    role: (role ?? null) as LeftNavProps["role"],
    cohortId: context.cohortMembers[0]?.cohort_id || null,
    companyId: company?.company_id || null,
    companyFunction: company?.function || null,
  };

  return (
    <div className="flex flex-col min-h-screen max-w-none">
      <TopBar />
      <div className="flex-1 flex flex-col md:flex-row max-w-none">
        <aside className="w-full md:w-[200px] shrink-0 border-r border-border bg-surface">
          <LeftNav {...navProps} />
        </aside>
        <main className="flex-1 overflow-y-auto bg-bg p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
