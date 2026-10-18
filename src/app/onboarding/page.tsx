import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const FIRST_WEEK_PLAN = [
  { day: "Day 1", title: "Welcome & setup", items: ["Set up your workspace", "Meet your manager", "Review company handbook"] },
  { day: "Day 2", title: "First tasks", items: ["Complete onboarding checklist", "Start your first task", "Attend team standup"] },
  { day: "Day 3", title: "Learning", items: ["Complete training modules", "Shadow a teammate", "Ask questions in chat"] },
  { day: "Day 4", title: "Contributing", items: ["Submit your first work", "Get feedback from manager", "Update your progress"] },
  { day: "Day 5", title: "Reflection", items: ["Review your week", "Plan next week", "Share feedback with HR"] },
];

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, status, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  const { data: checklistItems } = await supabase
    .from("onboarding_checklist_items")
    .select("*, progress:onboarding_checklist_progress!inner(is_completed, completed_by, completed_at)")
    .eq("organization_id", profile.organization_id)
    .eq("role", "intern")
    .order("order_index", { ascending: true });

  const { data: allItems } = await supabase
    .from("onboarding_checklist_items")
    .select("id, title, description, is_confirmation_item, order_index")
    .eq("organization_id", profile.organization_id)
    .eq("role", "intern")
    .order("order_index", { ascending: true });

  const completedCount = checklistItems?.filter((i) => i.progress?.[0]?.is_completed).length ?? 0;
  const totalCount = allItems?.length ?? 0;

  const { data: member } = await supabase
    .from("cohort_members")
    .select("joined_at")
    .eq("profile_id", profile.id)
    .eq("status", "active")
    .single();

  const isLate =
    member?.joined_at &&
    new Date() >
      new Date(new Date(member.joined_at).getTime() + 2 * 24 * 60 * 60 * 1000) &&
    completedCount < totalCount;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">Onboarding</h1>
      <p className="mt-2 text-sm text-text-muted">
        Welcome to your internship, {profile.display_name}. Complete your
        onboarding checklist during your first week.
      </p>

      {isLate && (
        <div className="mt-4 p-3 border border-text bg-text/5 rounded-md text-sm text-text">
          <p className="font-medium text-text">Late checklist</p>
          <p className="text-text-muted">
            You haven&rsquo;t completed your onboarding checklist within your
            first 2 days. Your manager and trainer have been notified.
          </p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">Checklist</h2>
        {allItems && allItems.length > 0 ? (
          <div className="space-y-3">
            {allItems.map((item) => {
              const progress = checklistItems?.find(
                (ci) => ci.id === item.id
              )?.progress?.[0];
              const isCompleted = progress?.is_completed ?? false;
              const isConfirmation = item.is_confirmation_item;

              return (
                <div
                  key={item.id}
                  className="border border-border p-3 rounded-md bg-surface flex items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => {}}
                    disabled={isConfirmation || isCompleted}
                    className="rounded border-input text-accent focus:ring-accent"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-text font-medium">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-text-muted">
                        {item.description}
                      </p>
                    )}
                    <span className="text-xs">
                      {isConfirmation
                        ? "Confirmed by HR/trainer"
                        : "Mark by yourself"
                      }
                    </span>
                  </div>
                  {isCompleted && (
                    <span className="text-xs text-green-600 font-medium">
                      Completed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No checklist items assigned yet.
          </p>
        )}

        <div className="mt-4 text-xs text-text-muted">
          Progress: {completedCount} of {totalCount} items complete
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text mb-3">First-Week Plan</h2>
        <div className="space-y-4">
          {FIRST_WEEK_PLAN.map((day) => (
            <div key={day.day} className="border border-border p-3 rounded-md bg-surface">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-text">
                  {day.day}: {day.title}
                </h3>
              </div>
              <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
                {day.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent-hover focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
