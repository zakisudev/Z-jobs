"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { publishJob, closeJob } from "@/app/employer/_actions";
import { Button } from "@/components/ui/button";

export function JobRowActions({
  companySlug,
  jobId,
  slug,
  status,
}: {
  companySlug: string;
  jobId: string;
  slug: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(fn: () => Promise<{ ok: boolean; error?: { message: string } }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        router.refresh();
        toast.success("Updated.");
      } else {
        // Quota rejections land here and must be readable — this is where an
        // employer learns why publishing was refused.
        toast.error(result.error?.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {status === "PUBLISHED" && (
        <Button asChild variant="outline" size="sm">
          <Link href={`/jobs/${slug}`}>View</Link>
        </Button>
      )}

      {/* No "Applicants" button here: the row already links to the pipeline
          from the applicant count, and two controls to the same place made the
          row read as four equally-weighted actions. */}

      {(status === "DRAFT" || status === "CLOSED" || status === "EXPIRED") && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => {
            run(() => publishJob(companySlug, jobId));
          }}
        >
          Publish
        </Button>
      )}

      {status === "PUBLISHED" && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            run(() => closeJob(companySlug, jobId));
          }}
        >
          Close
        </Button>
      )}
    </div>
  );
}
