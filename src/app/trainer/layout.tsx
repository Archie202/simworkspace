import { getUserContext, getUserRole } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getUserContext();
  const role = getUserRole(context);

  // Only trainers, school admins, and platform admins can access trainer routes
  if (
    role !== "trainer" &&
    role !== "school_admin" &&
    role !== "platform_admin"
  ) {
    redirect("/not-allowed");
  }

  return (
    <div className="flex flex-col min-h-screen max-w-none">
      <div className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-text">Trainer Console</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-muted">{context.profile?.display_name}</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col md:flex-row max-w-none">
        <aside className="w-full md:w-[200px] shrink-0 border-r border-border bg-surface px-3 py-4">
          <nav className="space-y-1 list-none p-0 m-0">
            <a
              href="/trainer/dashboard"
              className="block min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Dashboard
            </a>
            <a
              href="/trainer/cohorts"
              className="block min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Cohorts
            </a>
            <a
              href="/trainer/companies"
              className="block min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Companies
            </a>
            <a
              href="/trainer/invite"
              className="block min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Invite Intern
            </a>
            <a
              href="/trainer/consent"
              className="block min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Guardian Consent
            </a>
            <a
              href="/hr/job-postings"
              className="block min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Job Postings
            </a>
            <a
              href="/hr/screening"
              className="block min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Screening
            </a>
            <a
              href="/hr/interviews"
              className="block min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Interviews
            </a>
            <a
              href="/hr/offers"
              className="block min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Offers
            </a>
            <a
              href="/hr/override"
              className="block min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Override & Placement
            </a>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto bg-bg p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
