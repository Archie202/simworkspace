import Link from "next/link";
import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const error = searchParams.error;
  const reset = searchParams.reset;

  let errorMessage: string | undefined;
  if (error === "email_not_confirmed") {
    errorMessage = "This account needs email confirmation before signing in.";
  } else if (error === "invalid_credentials") {
    errorMessage = "The email address or password is incorrect.";
  } else if (error === "sign_in_failed" || error === "reset_failed") {
    errorMessage = "Something went wrong. Please try again.";
  }

  return (
    <main className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-bg p-4">
      <form
        action={signIn}
        className="w-full max-w-md space-y-4 bg-surface border border-border p-6 rounded-md"
        method="POST"
      >
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-text">Sign in</h1>
          <p className="text-sm text-text-muted">
            Sign in to your internship workspace.
          </p>
        </div>

        {errorMessage && (
          <div className="border border-destructive bg-destructive/10 p-3 rounded-md text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {reset === "sent" && (
          <div className="border border-green-600 bg-green-600/10 p-3 rounded-md text-sm text-green-600">
            If an account exists for that email, a reset link has been sent.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text">
              Email address
            </label>
            <Input id="email" name="email" type="email" placeholder="name@school.test" required />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text">
              Password
            </label>
            <Input id="password" name="password" type="password" required />
          </div>

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </div>

        <p className="text-sm text-text-muted text-center">
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Create one
          </Link>
        </p>

        <div className="bg-surface border border-border p-3 rounded-md text-sm">
          <p className="font-medium text-text">Under 18?</p>
          <p className="text-text-muted">
            Your account stays inactive until your guardian gives consent and a
            trainer verifies it. You won&rsquo;t be able to enter the workspace
            until then.
          </p>
        </div>
      </form>
    </main>
  );
}
