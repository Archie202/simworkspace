"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCompany(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const industry = formData.get("industry") as string;
  const description = formData.get("description") as string;
  const culture = formData.get("culture") as string;

  // Get user's organization
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/not-allowed");
  }

  // Get user's cohort
  const { data: cohortMember } = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("profile_id", user.id)
    .eq("status", "active")
    .single();

  if (!cohortMember) {
    redirect("/trainer/companies?error=no_cohort");
  }

  const { error } = await supabase.from("companies").insert({
    name,
    organization_id: profile.organization_id,
    cohort_id: cohortMember.cohort_id,
    industry: industry || null,
    description: description || null,
    culture: culture || null,
    created_by: user.id,
  });

  if (error) {
    redirect("/trainer/companies?error=create_failed");
  }

  redirect("/trainer/companies");
}
