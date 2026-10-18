import Link from "next/link";
import { signUp } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const success = searchParams.success as string | undefined;
  const error = searchParams.error as string | undefined;

  let errorMessage: string | undefined;
  if (error === "validation_failed") {
    errorMessage = "Please check your inputs and try again.";
  } else if (error === "account_exists") {
    errorMessage = "An account with this email already exists.";
  } else if (error === "signup_failed") {
    errorMessage = "Account creation failed. Please try again.";
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">Create an account</h1>
      <p className="mt-2 text-sm text-text-muted">
        Join the internship workspace. Choose your role below.
      </p>

      {success === "account_created" && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          Your account has been created. Please check your email to verify
          your address, then sign in. Your account will be inactive until a
          trainer or school admin verifies your role.
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <form
        action={signUp}
        className="mt-6 space-y-4"
        method="POST"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-text"
          >
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@school.test"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text"
          >
            Password (8+ characters)
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
          />
        </div>

        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-text"
          >
            Full name
          </label>
          <Input
            id="full_name"
            name="full_name"
            placeholder="Jane Doe"
            required
          />
        </div>

        <div>
          <label
            htmlFor="display_name"
            className="block text-sm font-medium text-text"
          >
            Display name (how you appear to others)
          </label>
          <Input
            id="display_name"
            name="display_name"
            placeholder="Jane"
            required
          />
        </div>

        <div>
          <label
            htmlFor="date_of_birth"
            className="block text-sm font-medium text-text"
          >
            Date of birth
          </label>
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            required
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-text"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            className="block w-full min-h-[44px] rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="intern">Intern</option>
            <option value="trainer">Trainer</option>
            <option value="school_admin">School admin</option>
          </select>
        </div>

        <div className="bg-surface border border-border p-3 rounded-md text-sm">
          <p className="font-medium text-text">Important:</p>
          <ul className="text-text-muted list-disc list-inside mt-1 space-y-1">
            <li>
              Your account starts <strong>inactive</strong>. A trainer or
              school admin must verify your role before you can sign in.
            </li>
            <li>
              If you are under 18, your account stays
              <strong>pending_consent</strong> until a guardian confirms
              consent and a trainer verifies it.
            </li>
            <li>
              All chat channels and direct messages are visible to trainers
              and the safeguarding lead.
            </li>
          </ul>
        </div>

        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-muted text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
