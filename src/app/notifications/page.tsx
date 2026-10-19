import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const KIND_LABELS: Record<string, string> = {
  offer: "Job Offer",
  interview: "Interview",
  review: "Review",
  announcement: "Announcement",
  absence: "Absence",
  lateness: "Lateness",
  consent: "Consent",
};

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, title, body, link, read_at, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", user.id)
    .is("read_at", null);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Notifications</h1>
          <p className="text-sm text-text-muted">
            Your recent notifications and updates.
          </p>
        </div>
      </div>

      <div className="mt-6">
        {notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`border border-border rounded-md p-4 bg-surface ${
                  !n.read_at ? "bg-white shadow-sm" : "bg-zinc-50 opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Badge variant={getKindBadge(n.kind)}>
                      {KIND_LABELS[n.kind] || n.kind}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text">
                      {n.title}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {n.body}
                    </p>
                    <p className="text-xs text-zinc-400 mt-2">
                      {new Date(n.created_at).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                      )}
                    </p>
                  </div>
                </div>
                {n.link && (
                  <a
                    href={n.link}
                    className="mt-2 text-xs text-accent underline underline-offset-2 hover:text-accent-hover"
                  >
                    Open
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500">
            <p className="text-sm">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getKindBadge(kind: string): "default" | "secondary" | "destructive" | "outline" {
  switch (kind) {
    case "offer":
      return "default";
    case "interview":
      return "secondary";
    case "review":
      return "outline";
    case "announcement":
      return "secondary";
    case "absence":
      return "destructive";
    case "lateness":
      return "secondary";
    case "consent":
      return "outline";
    default:
      return "outline";
  }
}
