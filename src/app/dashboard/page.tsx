import { getAttendance } from "./clock-actions";
import ClockControl from "@/components/clock/ClockControl";
import ShellLayout from "@/components/shell/ShellLayout";

export default async function DashboardPage() {
  const attendance = await getAttendance();

  if ("error" in attendance) {
    return (
      <ShellLayout>
        <div>
          <h1 className="text-xl font-semibold text-text">Dashboard</h1>
          <p className="mt-2 text-sm text-text-muted">{attendance.error}</p>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <div>
        <h1 className="text-xl font-semibold text-text">Dashboard</h1>
        <p className="mt-2 text-sm text-text-muted">
          Welcome to your workspace. Select an option from the navigation to
          get started.
        </p>

        <div className="mt-8">
          <ClockControl
            status={attendance.status as "clocked_in" | "clocked_out" | "none"}
            minutesWorked={attendance.minutesWorked}
          />
        </div>
      </div>
      </ShellLayout>
    );
}
