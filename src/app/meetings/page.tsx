import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type Meeting = {
  id: string;
  title: string;
  kind: string;
  starts_at: string;
  duration_minutes: number;
  meeting_url: string;
  created_by: string;
  company_id: string | null;
  organization_id: string;
  cohort_id: string;
  meeting_attendees: Array<{
    profile_id: string;
    rsvp: string | null;
  }>;
  creator: {
    display_name: string | null;
  } | null;
};

const KIND_LABELS: Record<string, string> = {
  standup: "Standup",
  interview: "Interview",
  one_to_one: "One-to-One",
  workshop: "Workshop",
};

export default async function MeetingsPage() {
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

  const { data: meetings } = await supabase
    .from("meetings")
    .select(
      "*, meeting_attendees!inner(profile_id, rsvp), creator:profiles!created_by(display_name)"
    )
    .eq("meeting_attendees.profile_id", user.id)
    .order("starts_at", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text">Meetings</h1>
          <p className="text-sm text-text-muted">
            View and join your scheduled meetings.
          </p>
        </div>
      </div>

      {meetings && meetings.length > 0 ? (
        <div className="space-y-3">
          {meetings.map((m: Meeting) => (
            <div
              key={m.id}
              className="border border-border rounded-lg p-4 bg-surface hover:shadow-sm hover:border-accent transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text">
                    {m.title}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {KIND_LABELS[m.kind] || m.kind} •
                    Hosted by {m.creator?.display_name || "Unknown"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(m.starts_at).toLocaleDateString(
                      undefined,
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {m.kind}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={m.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 min-h-[36px] px-3 py-1 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm text-accent underline underline-offset-2 hover:text-accent-hover"
                >
                  <span className="text-xs">Join Call</span>
                </a>
                <span className="text-xs text-zinc-500">
                  {m.duration_minutes} min
                </span>
              </div>
              <div className="mt-2">
                <p className="text-xs text-zinc-500">Your RSVP:</p>
                <span className="text-xs font-medium">
                  {m.meeting_attendees?.[0]?.rsvp || "Not responded"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-500">
          <p className="text-sm">No upcoming meetings.</p>
        </div>
      )}
    </div>
  );
}
