import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 10;

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

  // Parse filters
  const search = (searchParams.search as string) || "";
  const trackFilter = (searchParams.track as string) || "";
  const companyFilter = (searchParams.company as string) || "";
  const page = Math.max(parseInt((searchParams.page as string) || "1", 10), 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Build query
  let query = supabase
    .from("job_postings")
    .select(
      "id, title, function, track, description, requirements, openings, status, created_at, companies!inner(name)",
      { count: "exact" }
    )
    .eq("cohort_id", cohortMember.cohort_id)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (trackFilter) {
    query = query.eq("track", trackFilter as "software_development" | "data_analytics" | "program_management" | "hr");
  }

  if (companyFilter) {
    query = query.eq("company_id", companyFilter);
  }

  query = query.range(from, to);

  const { data: postings, count } = await query;

  // Get distinct tracks and companies for filters
  const { data: allPostings } = await supabase
    .from("job_postings")
    .select("track, company_id, companies!inner(name)")
    .eq("cohort_id", cohortMember.cohort_id)
    .eq("status", "open");

  const tracks = [...new Set((allPostings ?? []).map((p) => p.track))].sort();
  const companies = [
    ...new Map(
      (allPostings ?? []).map((p) => [p.companies.name, p.companies.name])
    ).keys(),
  ].sort();

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

      {/* Filters */}
      <div className="mt-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="search" className="block text-xs font-medium text-text-muted mb-1">
            Search by title
          </label>
          <form action="" method="GET" className="relative">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search roles…"
              className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-3 text-sm text-text-muted hover:text-accent focus-visible:outline-accent focus-visible:outline-2"
            >
              Search
            </button>
            <input type="hidden" name="page" value="1" />
            {trackFilter && <input type="hidden" name="track" value={trackFilter} />}
            {companyFilter && <input type="hidden" name="company" value={companyFilter} />}
          </form>
        </div>

        {tracks.length > 1 && (
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="track" className="block text-xs font-medium text-text-muted mb-1">
              Track
            </label>
            <select
              id="track"
              name="track"
              defaultValue={trackFilter || ""}
              className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All tracks</option>
              {tracks.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
            <input type="hidden" name="page" value="1" />
            {search && <input type="hidden" name="search" value={search} />}
            {companyFilter && <input type="hidden" name="company" value={companyFilter} />}
          </div>
        )}

        {companies.length > 1 && (
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="company" className="block text-xs font-medium text-text-muted mb-1">
              Company
            </label>
            <select
              id="company"
              name="company"
              defaultValue={companyFilter || ""}
              className="w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input type="hidden" name="page" value="1" />
            {search && <input type="hidden" name="search" value={search} />}
            {trackFilter && <input type="hidden" name="track" value={trackFilter} />}
          </div>
        )}
      </div>

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
                  <Badge variant="outline" className="text-xs">
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
            No open positions match your filters in this cohort.
          </p>
        )}

        {/* Pagination */}
        {postings && postings.length > 0 && count && count > PAGE_SIZE && (
          <div className="mt-6 flex items-center justify-between text-sm text-text-muted">
            <p>
              Showing {from + 1} to {Math.min(to + 1, count)} of {count}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <a
                  href={`/jobs?search=${search}&track=${trackFilter}&company=${companyFilter}&page=${page - 1}`}
                  className="px-3 py-1.5 rounded-md border border-input hover:bg-fill focus-visible:outline-accent focus-visible:outline-2"
                >
                  Previous
                </a>
              )}
              {to < count && (
                <a
                  href={`/jobs?search=${search}&track=${trackFilter}&company=${companyFilter}&page=${page + 1}`}
                  className="px-3 py-1.5 rounded-md border border-input hover:bg-fill focus-visible:outline-accent focus-visible:outline-2"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
