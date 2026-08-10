"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Segment error boundary.
 *
 * Its existence is the point: without it a thrown render error shows React
 * Router's raw crash screen (or a blank page), and — worse — a failed data load
 * falls through to whatever empty state the page renders, so "broken" is
 * indistinguishable from "nothing here". That is exactly what the old MyJobs
 * page did: an unhandled fetch rejection left "No Jobs registered yet" on screen.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side report. The server-side cause is already in the structured
    // log, correlated by `digest`.
    console.error("dashboard segment error", error.digest ?? error.message);
  }, [error]);

  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 mx-auto flex max-w-lg flex-col items-center rounded-lg border px-6 py-12 text-center"
    >
      <AlertCircle className="text-destructive size-10" aria-hidden="true" />
      <h2 className="mt-4 text-base font-semibold">We couldn&apos;t load this page</h2>
      <p className="text-muted-foreground mt-1 text-sm text-pretty">
        Something went wrong on our end. Your data is safe — try again in a moment.
      </p>

      {error.digest && (
        <p className="text-muted-foreground mt-3 font-mono text-xs">
          Reference: {error.digest}
        </p>
      )}

      <Button onClick={reset} className="mt-5" variant="outline">
        <RotateCw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
