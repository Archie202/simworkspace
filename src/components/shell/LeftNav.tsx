import Link from "next/link";

type Role = string | null;

export interface LeftNavProps {
  role: Role;
  cohortId: string | null;
  companyId: string | null;
  companyFunction: string | null;
}

const internItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/jobs", label: "Job board" },
  { href: "/tasks", label: "Tasks" },
  { href: "/chat", label: "Chat" },
  { href: "/meetings", label: "Meetings" },
  { href: "/record", label: "My record" },
];

const hrItems = [
  { href: "/hiring", label: "Hiring" },
  { href: "/attendance", label: "Attendance" },
];

const managerItems = [
  { href: "/reviews", label: "Reviews" },
];

const trainerItems = [
  { href: "/trainer/dashboard", label: "Trainer dashboard" },
  { href: "/trainer/cohorts", label: "Cohorts" },
  { href: "/trainer/companies", label: "Companies" },
  { href: "/trainer/users", label: "Users" },
];

const schoolAdminItems = [
  { href: "/admin/organization", label: "Organization" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit", label: "Audit log" },
];

export default function LeftNav({
  role,
  cohortId,
  companyId,
  companyFunction,
}: LeftNavProps) {
  let items: { href: string; label: string }[] = [];

  if (role === "trainer" || role === "school_admin" || role === "platform_admin") {
    items = trainerItems;
  } else {
    items = [...internItems];

    if (role === "hr" || companyFunction === "hr") {
      items = [...items, ...hrItems];
    }

    if (role === "manager" || companyFunction === "manager") {
      items = [...items, ...managerItems];
    }

    if (role === "school_admin") {
      items = [...items, ...schoolAdminItems];
    }
  }

  // cohortId and companyId are available for future per-company/per-cohort
  // navigation filtering; kept in the interface for consistency.
  void cohortId;
  void companyId;

  return (
    <nav className="bg-surface border-r border-border px-3 py-4 shrink-0">
      <ul className="space-y-1 list-none p-0 m-0">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
