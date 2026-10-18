import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { inviteIntern } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function InviteInternPage() {
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

  const orgId = profile?.organization_id;

  if (!orgId) {
    redirect("/not-allowed");
  }

  // Get cohorts in the trainer's organization
  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("id, name, status")
    .eq("organization_id", orgId);

  return (
    <div>
      <h1 className="text-xl font-semibold text-text">Invite Intern</h1>
      <p className="mt-2 text-sm text-text-muted">
        Invite a new intern to join your cohort.
      </p>

      <form
        action={inviteIntern}
        className="mt-6 space-y-4 max-w-md"
        method="POST"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text"
          >
            Email address
          </label>
          <Input id="email" name="email" type="email" placeholder="name@school.test" required />
        </div>

        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-text"
          >
            Full name
          </label>
          <Input id="full_name" name="full_name" placeholder="Jane Doe" required />
        </div>

        <div>
          <label
            htmlFor="display_name"
            className="block text-sm font-medium text-text"
          >
            Display name
          </label>
          <Input id="display_name" name="display_name" placeholder="Jane" required />
        </div>

        <div>
          <label
            htmlFor="date_of_birth"
            className="block text-sm font-medium text-text"
          >
            Date of birth
          </label>
          <Input id="date_of_birth" name="date_of_birth" type="date" required />
        </div>

        <div>
          <label
            htmlFor="cohort_id"
            className="block text-sm font-medium text-text"
          >
            Cohort
          </label>
          <select id="cohort_id" name="cohort_id" required className="block w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="">Select a cohort</option>
            {cohorts?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status})
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-text-muted">
          Interns under 18 will be created with pending_consent status and
          require guardian verification before they can sign in.
        </p>

        <Button type="submit">Send invitation</Button>
      </form>
    </div>
  );
}
