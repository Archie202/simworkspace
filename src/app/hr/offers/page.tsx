import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { makeOffer } from "./actions";
import { Button } from "@/components/ui/button";

export default async function OffersPage({
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

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Get user's company memberships
  const { data: companyMembers } = await supabase
    .from("company_members")
    .select("company_id, function")
    .eq("profile_id", user.id);

  const isTrainerOrAdmin =
    (await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", profile.organization_id))?.data?.some(
      (r) => r.role === "trainer" || r.role === "school_admin"
    ) || false;

  const companyIds = companyMembers
    ?.filter(
      (cm) =>
        cm.function === "hr" ||
        cm.function === "manager" ||
        isTrainerOrAdmin
    )
    .map((cm) => cm.company_id);

  if (!companyIds || companyIds.length === 0) {
    redirect("/not-allowed");
  }

  // Get applications at interview stage (ready for offers)
  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, status, attempt_number, created_at, applicants:profiles!applicant_id(full_name, display_name, date_of_birth), job_postings!inner(title, company_id, companies!inner(name))"
    )
    .in("company_id", companyIds)
    .in("status", ["interview"])
    .order("created_at", { ascending: false });

  // Get existing offers to avoid duplicates
  const { data: existingOffers } = await supabase
    .from("offers")
    .select("application_id, response");

  const offeredApplicationIds = new Set(
    existingOffers?.map((o) => o.application_id) ?? []
  );

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let statusMessage: string | undefined;
  if (success === "offer_made") {
    statusMessage = "Offer made successfully.";
  } else if (error === "make_failed") {
    statusMessage = "Failed to make offer. Please try again.";
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">Job Offers</h1>
      <p className="mt-2 text-sm text-text-muted">
        Make offers to interviewed applicants.
      </p>

      {statusMessage && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          {statusMessage}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">Ready for Offers</h2>
        {applications && applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => {
              const applicant = app.applicants as {
                full_name: string;
                display_name: string;
                date_of_birth: string | null;
              } | null;
              const alreadyOffered = offeredApplicationIds.has(app.id);

              return (
                <div
                  key={app.id}
                  className="border border-border p-4 rounded-md bg-surface"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-text">
                        {applicant?.display_name || "Unknown applicant"}
                      </h3>
                      <p className="text-xs text-text-muted">
                        {app.job_postings.companies.name} •
                        {app.job_postings.title}
                      </p>
                    </div>
                    {alreadyOffered ? (
                      <span className="text-xs font-medium text-text-muted">
                        Offer made
                      </span>
                    ) : null}
                  </div>

                  {alreadyOffered ? (
                    <p className="text-sm text-text-muted">
                      An offer has already been made for this application.
                    </p>
                  ) : (
                    <form
                      action={makeOffer}
                      className="mt-3"
                      method="POST"
                    >
                      <input
                        type="hidden"
                        name="application_id"
                        value={app.id}
                      />
                      <Button type="submit">Make Offer</Button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No applications ready for offers.
          </p>
        )}
      </div>
    </div>
  );
}
