import { createCompany } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateCompanyPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-text">Create Company</h1>
      <p className="mt-2 text-sm text-text-muted">
        Set up a new simulated company within a cohort.
      </p>

      <form
        action={createCompany}
        className="mt-6 space-y-4 max-w-md"
        method="POST"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text"
          >
            Company name
          </label>
          <Input id="name" name="name" placeholder="Tech Co." required />
        </div>

        <div>
          <label
            htmlFor="industry"
            className="block text-sm font-medium text-text"
          >
            Industry
          </label>
          <Input id="industry" name="industry" placeholder="Software Development" />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-text"
          >
            Description
          </label>
          <Input id="description" name="description" placeholder="What does this company do?" />
        </div>

        <div>
          <label
            htmlFor="culture"
            className="block text-sm font-medium text-text"
          >
            Culture
          </label>
          <Input id="culture" name="culture" placeholder="What is the company culture?" />
        </div>

        <Button type="submit">Create company</Button>
      </form>
    </div>
  );
}
