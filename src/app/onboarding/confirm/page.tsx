import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ConfirmChecklistPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", profile.organization_id);

  const isTrainer =
    userRoles?.some((r) => r.role === "trainer") ||
    userRoles?.some((r) => r.role === "school_admin");

  const { data: companyMember } = await supabase
    .from("company_members")
    .select("function")
    .eq("profile_id", user.id)
    .is("ended_at", null)
    .single();

  const isHrOrManager =
    companyMember &&
    (companyMember.function === "hr" || companyMember.function === "manager");

  if (!isTrainer && !isHrOrManager) {
    redirect("/not-allowed");
  }

  const { data: internProfiles } = await supabase
    .from("profiles")
    .select("id, display_name, email, status")
    .eq("organization_id", profile.organization_id)
    .eq("status", "active")
    .order("display_name", { ascending: true });

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let statusMessage: string | undefined;
  if (success === "item_confirmed") {
    statusMessage = "Checklist item confirmed.";
  } else if (error === "confirm_failed") {
    statusMessage = "Failed to confirm item. Please try again.";
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">Confirm Checklist Items</h1>
      <p className="mt-2 text-sm text-text-muted">
        Confirm onboarding checklist items for interns.
      </p>

      {statusMessage && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          {statusMessage}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">Interns</h2>
        {internProfiles && internProfiles.length > 0 ? (
          <div className="space-y-4">
            {internProfiles.map((intern) => (
              <div
                key={intern.id}
                className="border border-border p-4 rounded-md bg-surface"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text">
                      {intern.display_name}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {intern.email}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-text-muted">
                    {intern.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-text-muted">
                    Confirmation items for {intern.display_name} will appear
                    here once they have checklist items assigned.
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No interns found in your organization.
          </p>
        )}
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
