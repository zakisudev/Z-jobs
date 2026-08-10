import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/data/empty-state";

export const metadata: Metadata = {
  title: "Job alerts",
  robots: { index: false, follow: false },
};

export default function AlertsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Job alerts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Get an email when new roles match your search.
        </p>
      </div>

      <EmptyState
        icon={Bell}
        title="No alerts set up"
        description="Save a search and we'll email you when matching jobs are posted. You can unsubscribe from any alert in one click."
        action={{ href: "/jobs", label: "Search jobs" }}
      />
    </div>
  );
}
