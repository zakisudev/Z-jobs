import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { EmptyState } from "@/components/data/empty-state";

export const metadata: Metadata = {
  title: "Saved jobs",
  robots: { index: false, follow: false },
};

export default function SavedJobsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved jobs</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Roles you&apos;ve bookmarked to come back to.
        </p>
      </div>

      <EmptyState
        icon={Bookmark}
        title="Nothing saved yet"
        description="Save a job while you're browsing and it will wait for you here. We'll warn you before a saved listing expires."
        action={{ href: "/jobs", label: "Browse jobs" }}
      />
    </div>
  );
}
