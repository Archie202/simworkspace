import { confirmGuardianConsent } from "./actions";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SAFEGUARDING_SUMMARY_V1 } from "./actions";

export default async function ConfirmConsentPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const guardianLinkId = searchParams.guardian_link_id as string | undefined;
  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  if (!guardianLinkId) {
    redirect("/login");
  }

  let errorMessage: string | undefined;
  if (error === "missing_token") {
    errorMessage = "Missing confirmation link.";
  } else if (error === "invalid_token") {
    errorMessage = "This confirmation link is invalid or has expired.";
  } else if (error === "already_verified") {
    errorMessage = "This guardian link has already been verified.";
  } else if (error === "not_confirmed") {
    errorMessage = "You must confirm consent to proceed.";
  } else if (error === "record_failed" || error === "verify_failed") {
    errorMessage = "Something went wrong. Please try again.";
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">Guardian Consent</h1>

      {success === "confirmed" && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          Thank you. Consent has been recorded. A trainer will now verify your
          guardianship and activate the account.
        </div>
      )}

      {!success && (
        <>
          {errorMessage && (
            <div className="mt-4 p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="mt-6 border border-border p-4 rounded-md bg-surface">
            <h2 className="text-sm font-semibold text-text mb-3">
              Safeguarding Summary
            </h2>
            <div className="text-sm text-text-muted whitespace-pre-wrap break-words">
              {SAFEGUARDING_SUMMARY_V1}
            </div>
          </div>

          <form
            action={confirmGuardianConsent}
            className="mt-6 space-y-3"
            method="POST"
          >
            <input type="hidden" name="guardian_link_id" value={guardianLinkId} />
            <Button type="submit" name="confirmed" value="true">
              I confirm consent
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
