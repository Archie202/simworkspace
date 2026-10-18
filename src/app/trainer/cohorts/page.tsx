import { createCohort } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateCohortPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-text">Create Cohort</h1>
      <p className="mt-2 text-sm text-text-muted">
        Set up a new 6-week internship cohort.
      </p>

      <form
        action={createCohort}
        className="mt-6 space-y-4 max-w-md"
        method="POST"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-text"
          >
            Cohort name
          </label>
          <Input
            id="name"
            name="name"
            placeholder="Cohort 2027"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start_date"
              className="block text-sm font-medium text-text"
            >
              Start date
            </label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              required
            />
          </div>

          <div>
            <label
              htmlFor="end_date"
              className="block text-sm font-medium text-text"
            >
              End date
            </label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="daily_hours_target"
              className="block text-sm font-medium text-text"
            >
              Daily hours target
            </label>
            <Input
              id="daily_hours_target"
              name="daily_hours_target"
              type="number"
              defaultValue="4"
              required
            />
          </div>

          <div>
            <label
              htmlFor="work_start_time"
              className="block text-sm font-medium text-text"
            >
              Working start time
            </label>
            <Input
              id="work_start_time"
              name="work_start_time"
              type="time"
              required
            />
          </div>
        </div>

        <Button type="submit">Create cohort</Button>
      </form>
    </div>
  );
}
