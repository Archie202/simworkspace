import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { respondToOffer } from "./actions";

export default async function OfferPage({
  params,
  searchParams,
}: {
  params: { offerId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the offer with application and applicant details
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select(
      "id, response, offered_at, responded_at, offered_by, applicants:applications!inner(applicant_id, job_postings!inner(title, company_id, companies!inner(name)))"
    )
    .eq("id", params.offerId)
    .single();

  if (offerError || !offer) {
    redirect("/not-allowed");
  }

  const application = offer.applicants as {
    applicant_id: string;
    job_postings: {
      title: string;
      company_id: string;
      companies: { name: string };
    };
  };
  const jobPosting = application.job_postings;

  // Verify the applicant is the current user
  if (application.applicant_id !== user.id) {
    redirect("/not-allowed");
  }

  // Only pending offers can be responded to
  if ((offer.response as string) !== "pending") {
    redirect(`/dashboard?error=offer_already_responded`);
  }

  const error = searchParams.error as string | undefined;
  const success = searchParams.success as string | undefined;

  let statusMessage: string | undefined;
  if (success === "offer_accepted") {
    statusMessage = "Offer accepted! You are now a company member.";
  } else if (success === "offer_declined") {
    statusMessage = "Offer declined.";
  } else if (error === "respond_failed") {
    statusMessage = "Failed to respond to offer. Please try again.";
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">Job Offer</h1>
      <p className="mt-2 text-sm text-text-muted">
        Review and respond to this offer.
      </p>

      {statusMessage && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          {statusMessage}
        </div>
      )}

      <div className="mt-6">
        <div className="border border-border p-4 rounded-md bg-surface">
          <h2 className="text-sm font-semibold text-text mb-2">
            {jobPosting.title}
          </h2>
          <p className="text-xs text-text-muted">
            {jobPosting.companies.name}
          </p>
          <p className="text-sm text-text mt-2">
            You have been offered a position as an intern at{' '}
            {jobPosting.companies.name}.
          </p>
          <p className="text-sm text-text-muted mt-2">
            Offer made:{new Date(offer.offered_at).toLocaleDateString()}
          </p>
        </div>

        {offer.response === "pending" && (
          <div className="mt-6 space-y-3">
            <form
              action={respondToOffer}
              className="space-y-3"
              method="POST"
            >
              <input type="hidden" name="offer_id" value={params.offerId} />
              <input
                type="hidden"
                name="response"
                value="accepted"
              />
              <Button type="submit">Accept Offer</Button>
            </form>
            <form
              action={respondToOffer}
              className="space-y-3"
              method="POST"
            >
              <input type="hidden" name="offer_id" value={params.offerId} />
              <input
                type="hidden"
                name="response"
                value="declined"
              />
              <Button type="submit" variant="outline">
                Decline Offer
              </Button>
            </form>
          </div>
        )}

        {(offer.response as string) === "accepted" && (
          <div className="mt-6 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
            <p className="font-medium">Offer accepted.</p>
            <p className="text-text-muted">
              You are now a company member. Check your dashboard to get started.
            </p>
          </div>
        )}

        {(offer.response as string) === "declined" && (
          <div className="mt-6 p-3 border border-text-muted bg-background rounded-md text-sm text-text-muted">
            <p className="font-medium">Offer declined.</p>
          </div>
        )}
      </div>
    </div>
  );
}
