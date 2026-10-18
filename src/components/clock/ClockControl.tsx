"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { clockIn as clockInAction, clockOut as clockOutAction } from "@/app/dashboard/clock-actions";

interface ClockControlProps {
  status: "clocked_in" | "clocked_out" | "none";
  minutesWorked: number | null;
}

export default function ClockControl({
  status,
  minutesWorked,
}: ClockControlProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClockIn = async () => {
    setError(null);
    setSuccess(null);
    const result = await clockInAction();
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setSuccess(result.success || "Clocked in successfully.");
    }
  };

  const handleClockOut = async () => {
    setError(null);
    setSuccess(null);
    const result = await clockOutAction();
    if ("error" in result && result.error) {
      setError(result.error);
    } else {
      setSuccess(result.success || "Clocked out successfully.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-text">Clock In / Out</h1>
      <p className="mt-2 text-sm text-text-muted">
        Record your work hours for today.
      </p>

      {error && (
        <div className="mt-4 p-3 border border-destructive bg-destructive/10 rounded-md text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 border border-green-600 bg-green-600/10 rounded-md text-sm text-green-600">
          {success}
        </div>
      )}

      <div className="mt-6">
        <div className="border border-border p-4 rounded-md bg-surface">
          <h2 className="text-sm font-semibold text-text mb-3">Today&rsquo;s Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Status</span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  status === "clocked_in"
                    ? "bg-green-100 text-green-700"
                    : status === "clocked_out"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {status === "clocked_in"
                  ? "Clocked In"
                  : status === "clocked_out"
                  ? "Clocked Out"
                  : "Not Clocked In"}
              </span>
            </div>
            {minutesWorked != null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Minutes Worked</span>
                <span className="text-sm font-semibold text-text">
                  {minutesWorked}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {status === "none" ? (
            <Button onClick={handleClockIn} className="w-full">
              Clock In
            </Button>
          ) : status === "clocked_in" ? (
            <Button
              onClick={handleClockOut}
              className="w-full"
              variant="destructive"
            >
              Clock Out
            </Button>
          ) : (
            <Button disabled className="w-full">
              Already Clocked Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
