"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  full_name: z.string().min(1, "Full name is required"),
  display_name: z.string().min(1, "Display name is required"),
  date_of_birth: z.string().refine(
    (val) => {
      const dob = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      return age >= 13;
    },
    { message: "Intern must be at least 13 years old" }
  ),
  cohort_id: z.string().uuid("Select a valid cohort"),
});

export async function inviteIntern(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get trainer's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;
  const displayName = formData.get("display_name") as string;
  const dateOfBirth = formData.get("date_of_birth") as string;
  const cohortId = formData.get("cohort_id") as string;

  const parsed = inviteSchema.safeParse({
    email,
    full_name: fullName,
    display_name: displayName,
    date_of_birth: dateOfBirth,
    cohort_id: cohortId,
  });

  if (!parsed.success) {
    redirect("/trainer/invite?error=validation_failed");
  }

  // Verify the trainer is in this cohort
  const { data: cohortMember } = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("profile_id", user.id)
    .eq("cohort_id", cohortId)
    .eq("status", "active")
    .single();

  if (!cohortMember) {
    redirect("/trainer/invite?error=not_in_cohort");
  }

  // Check if the intern is under 18
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const isMinor = age < 18;

  // Invite the user via Supabase Auth admin API (service role key)
  const serviceSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: inviteData, error: inviteError } =
    await serviceSupabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        display_name: displayName,
        date_of_birth: dateOfBirth,
        organization_id: profile.organization_id,
      },
    });

  if (inviteError) {
    redirect("/trainer/invite?error=invite_failed");
  }

  // Create the profile
  const status = isMinor ? "pending_consent" : "active";

  const { error: profileError } = await serviceSupabase.from("profiles").insert({
    id: inviteData.user.id,
    organization_id: profile.organization_id,
    full_name: fullName,
    display_name: displayName,
    email,
    date_of_birth: dateOfBirth,
    status,
  });

  if (profileError) {
    redirect("/trainer/invite?error=profile_failed");
  }

  // Add to cohort
  const { error: memberError } = await serviceSupabase.from("cohort_members").insert({
    organization_id: profile.organization_id,
    cohort_id: cohortId,
    profile_id: inviteData.user.id,
    cohort_role: "intern",
    status: "active",
  });

  if (memberError) {
    redirect("/trainer/invite?error=member_failed");
  }

  redirect("/trainer/invite?success=sent");
}
