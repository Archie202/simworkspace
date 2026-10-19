"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const createDirectChannelSchema = z.object({
  target_profile_id: z.string().uuid(),
});

export async function createDirectChannel(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const target_profile_id = formData.get("target_profile_id") as string;

  const parsed = createDirectChannelSchema.safeParse({
    target_profile_id,
  });

  if (!parsed.success) {
    redirect("/chat?error=invalid_target");
  }

  // Call create_direct_channel() via service role
  const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
  const serviceSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await serviceSupabase.rpc("create_direct_channel", {
    a: user.id,
    b: parsed.data.target_profile_id,
  });

  if (error) {
    redirect(`/chat?error=${error.message}`);
  }

  redirect(`/chat?channel_id=${data}`);
}
