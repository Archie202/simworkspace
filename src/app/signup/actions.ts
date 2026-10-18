"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  full_name: z.string().min(1, "Full name is required"),
  display_name: z.string().min(1, "Display name is required"),
  date_of_birth: z.string().refine(
    (val) => {
      const dob = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      return age >= 13;
    },
    { message: "You must be at least 13 years old to sign up" }
  ),
  role: z.enum(["intern", "trainer", "school_admin"]),
});

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const displayName = formData.get("display_name") as string;
  const dateOfBirth = formData.get("date_of_birth") as string;
  const role = formData.get("role") as string;

  const parsed = signupSchema.safeParse({
    email,
    password,
    full_name: fullName,
    display_name: displayName,
    date_of_birth: dateOfBirth,
    role,
  });

  if (!parsed.success) {
    redirect("/signup?error=validation_failed");
  }

  const dob = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const isMinor = age < 18;

  // New accounts start as 'invited' (inactive) for adults,
  // 'pending_consent' for under-18s (awaiting guardian consent)
  const status = isMinor ? "pending_consent" : "invited";

  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        display_name: displayName,
        date_of_birth: dateOfBirth,
        role,
        status,
        organization_id: null, // assigned later by trainer/school admin
      },
    },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      redirect("/signup?error=account_exists");
    }
    redirect("/signup?error=signup_failed");
  }

  redirect("/signup?success=account_created");
}
