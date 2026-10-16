const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/jobs", label: "Job board" },
  { href: "/tasks", label: "Tasks" },
  { href: "/chat", label: "Chat" },
  { href: "/meetings", label: "Meetings" },
  { href: "/record", label: "My record" },
];

export default function LeftNav() {
  return (
    <nav className="bg-surface border-r border-border px-3 py-4 shrink-0">
      <ul className="space-y-1 list-none p-0 m-0">
        {navItems.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm text-text rounded-md hover:bg-fill hover:text-accent focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
