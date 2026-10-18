import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default async function JobBoardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's cohort membership
  const { data: cohortMember } = await supabase
    .from("cohort_members")
    .select("cohort_id, organization_id")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .single();

  if (!cohortMember) {
    redirect("/not-allowed");
  }

  // Get open job postings in the user's cohort
  const { data: postings } = await supabase
    .from("job_postings")
    .select(
      "id, title, function, track, description, requirements, openings, status, created_at, companies!inner(name)"
    )
    .eq("cohort_id", cohortMember.cohort_id)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const error = searchParams.error as string | undefined;

  return (
    <div>
      <h1 className="text-xl font-semibold text-text">Job Board</h1>
      <p className="mt-2 text-sm text-text-muted">
        Open positions in your cohort. Apply to a role to start your internship.
      </p>

      {error && (
        <div className="mt-4 p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive">
          Something went wrong. Please try again.
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">Open Positions</h2>
        {postings && postings.length > 0 ? (
          <div className="space-y-3">
            {postings.map((p) => (
              <div
                key={p.id}
                className="border border-border p-4 rounded-md bg-surface"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      {p.title}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {p.companies.name}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {p.track.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-text-muted mb-3">
                  {p.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                  <span>Function: {p.function}</span>
                  <span>Openings: {p.openings}</span>
                </div>
                {p.requirements && (
                  <p className="text-xs text-text-muted mb-3">
                    Requirements: {p.requirements}
                  </p>
                )}
                <a
                  href={`/apply/${p.id}`}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-accent rounded-md hover:bg-accent-hover focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Apply
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No open positions in your cohort at the moment.
          </p>
        )}
      </div>
    </div>
  );
}
