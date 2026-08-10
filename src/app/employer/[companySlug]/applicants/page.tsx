import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireCompany } from "@/server/auth/guard";
import { listForCompany } from "@/server/repos/application.repo";
import { EmptyState } from "@/components/data/empty-state";
import { Eyebrow } from "@/components/ui/section";
import { PIPELINE_STAGES } from "@/components/job/status-badge";
import { ApplicantCard } from "./applicant-card";

export const metadata: Metadata = {
  title: "Applicants",
  robots: { index: false, follow: false },
};

export default async function ApplicantsPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const ctx = await requireCompany(companySlug);
  // Scoped by companyId in the repo, not filtered here.
  const applications = await listForCompany(ctx);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <Eyebrow>Pipeline</Eyebrow>
        <h1 className="display text-display-sm mt-4">Applicants</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Everyone who has applied across all your jobs.
        </p>
      </header>

      {applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants yet"
          description="When someone applies to one of your jobs they'll appear here. Sharing your job link speeds this up considerably."
          action={{ href: `/employer/${companySlug}/jobs`, label: "View your jobs" }}
        />
      ) : (
        <>
          <PipelineSummary applications={applications} />

          <ul className="space-y-3">
            {applications.map((application) => (
              <li key={application.id}>
                <ApplicantCard companySlug={companySlug} application={application} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * Where everyone stands, at a glance.
 *
 * An employer's first question on this page is "how many people am I actually
 * still considering", and a flat reverse-chronological list answers it only by
 * making them count. `VIEWED` folds into the new column because opening
 * someone's application is not a decision about them.
 */
function PipelineSummary({ applications }: { applications: { status: string }[] }) {
  const counts = new Map<string, number>();
  for (const a of applications) {
    const bucket = a.status === "VIEWED" ? "SUBMITTED" : a.status;
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  return (
    <section
      aria-label="Pipeline summary"
      className={[
        "border-border bg-sunken grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-5",
        // Five stages into two columns leaves a dead cell showing the gap
        // colour, which reads as a missing tile. The last one spans instead.
        "[&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1",
      ].join(" ")}
    >
      {PIPELINE_STAGES.map((stage) => {
        const count = counts.get(stage.value) ?? 0;
        return (
          <div key={stage.value} className="bg-card p-4">
            <p className="text-muted-foreground text-2xs font-semibold tracking-[0.14em] uppercase">
              {stage.label}
            </p>
            <p
              data-numeric
              className={`display mt-2 text-3xl leading-none ${
                count === 0 ? "text-muted-foreground/50" : ""
              }`}
            >
              {count}
            </p>
          </div>
        );
      })}
    </section>
  );
}
