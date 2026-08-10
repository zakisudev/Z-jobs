import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { EmptyState } from "@/components/data/empty-state";

export const metadata: Metadata = {
  title: "Resumes",
  robots: { index: false, follow: false },
};

export default function ResumesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumes</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload a CV once and attach it to any application.
        </p>
      </div>

      <p className="text-muted-foreground border-border rounded-lg border border-dashed p-4 text-sm">
        Your resume is never public. Employers can only open it after you apply to one of
        their jobs, through a link that expires in five minutes — and every download is
        logged.
      </p>

      <EmptyState
        icon={ScrollText}
        title="No resume uploaded"
        description="PDF or Word, up to 5 MB. You can keep several and choose which one to send with each application."
      />
    </div>
  );
}
