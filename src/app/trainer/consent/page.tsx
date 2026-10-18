import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { recordConsent } from "./actions";
import { Button } from "@/components/ui/button";

export default async function TrainerConsentPage({
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
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Get under-18 interns with pending_consent in the trainer's org
  const { data: pendingInterns } = await supabase
    .from("profiles")
    .select(
      "id, full_name, display_name, email, date_of_birth, guardian_links(*)"
    )
    .eq("organization_id", profile.organization_id)
    .eq("status", "pending_consent");

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let errorMessage: string | undefined;
  if (error === "no_verified_guardian") {
    errorMessage = "No verified guardian link found for this intern.";
  } else if (error === "consent_already_recorded") {
    errorMessage = "Consent has already been recorded for this intern.";
  } else if (error === "record_failed" || error === "activate_failed") {
    errorMessage = "Something went wrong. Please try again.";
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-text">Guardian Consent</h1>
      <p className="mt-2 text-sm text-text-muted">
        Verify guardians and activate under-18 intern accounts.
      </p>

      {success === "recorded" && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          Consent recorded and account activated.
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text mb-3">
          Pending Guardian Consent
        </h2>
        {pendingInterns && pendingInterns.length > 0 ? (
          <div className="space-y-3">
            {pendingInterns.map((intern) => {
              const guardian = intern.guardian_links?.[0];
              const dob = intern.date_of_birth
                ? new Date(intern.date_of_birth).toLocaleDateString()
                : "unknown";
              const isMinor =
                intern.date_of_birth &&
                new Date().getFullYear() - new Date(intern.date_of_birth).getFullYear() < 18;

              return (
                <div key={intern.id} className="border border-border p-3 rounded-md bg-surface">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-text">
                        {intern.display_name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {intern.email} • Born {dob} • {isMinor ? "Under 18" : "18 or over"}
                      </p>
                    </div>
                  </div>
                  {guardian && (guardian as { status?: string }).status === "verified" ? (
                    <form
                      action={recordConsent}
                      className="mt-3"
                      method="POST"
                    >
                      <input type="hidden" name="intern_id" value={intern.id} />
                      <input
                        type="hidden"
                        name="text_version"
                        value="v1"
                      />
                      <Button type="submit" size="sm">
                        Record consent & activate account
                      </Button>
                    </form>
                  ) : (
                    <p className="mt-2 text-xs text-text-muted">
                      Guardian not yet verified. The guardian must confirm
                      consent first using the link sent to them.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            No interns pending guardian consent.
          </p>
        )}
      </div>
    </div>
  );
}
