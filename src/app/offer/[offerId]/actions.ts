"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function respondToOffer(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const offerId = formData.get("offer_id") as string;
  const response = formData.get("response") as string;

  if (response !== "accepted" && response !== "declined") {
    redirect("/dashboard?error=invalid_response");
  }

  // Call accept_offer() via service role
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const serviceSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: rpcError } = await serviceSupabase.rpc("accept_offer", {
    p_offer_id: offerId,
    p_response: response,
  });

  if (rpcError) {
    redirect(`/offer/${offerId}?error=respond_failed`);
  }

  redirect(`/dashboard?success=offer_${response}`);
}
