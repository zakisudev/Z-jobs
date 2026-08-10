import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Plus, ExternalLink, CheckCircle2, Users } from "lucide-react";
import { requireCompany } from "@/server/auth/guard";
import { listForCompany } from "@/server/repos/job.repo";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/data/empty-state";
import { Eyebrow } from "@/components/ui/section";
import { JobStatusBadge } from "@/components/job/status-badge";
import { JobRowActions } from "./job-row-actions";

export const metadata: Metadata = {
  title: "Jobs",
  robots: { index: false, follow: false },
};

export default async function EmployerJobsPage({
  params,
  searchParams,
}: {
  params: Promise<{ companySlug: string }>;
  searchParams: Promise<{ published?: string }>;
}) {
  const { companySlug } = await params;
  const { published } = await searchParams;
  const ctx = await requireCompany(companySlug);
  const jobs = await listForCompany(ctx);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Eyebrow>Listings</Eyebrow>
          <h1 className="display text-display-sm mt-4">Jobs</h1>
        </div>

        <Button asChild variant="accent" className="shrink-0">
          <Link href={`/employer/${companySlug}/jobs/new`}>
            <Plus aria-hidden="true" />
            Post a job
          </Link>
        </Button>
      </header>

      {published && (
        <div
          role="status"
          className="border-success/40 bg-success-wash flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border p-4 text-sm"
        >
          <CheckCircle2 className="text-success size-5 shrink-0" aria-hidden="true" />
          <span className="font-semibold">Your job is live.</span>
          <Link
            href={`/jobs/${published}`}
            className="text-primary inline-flex items-center gap-1 font-medium hover:underline"
          >
            View the public listing
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Post your first vacancy. It appears on the public board immediately and is indexed by search engines."
          action={{ href: `/employer/${companySlug}/jobs/new`, label: "Post a job" }}
        />
      ) : (
        // Card list rather than a table: this is the surface most likely to be
        // opened on a phone, and a table would need horizontal scrolling.
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="border-border bg-card rounded-xl border p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-pretty">{job.title}</h2>
                    <JobStatusBadge status={job.status} />
                  </div>

                  <p className="text-muted-foreground mt-2 text-xs" data-numeric>
                    {job.viewCount} {job.viewCount === 1 ? "view" : "views"}
                    {job.expiresAt &&
                      ` · expires ${job.expiresAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}`}
                  </p>

                  {/*
                    Applicants is a link, not a statistic. It is the reason an
                    employer opened this page, and burying the count in a line
                    of grey metadata made the one thing worth clicking look
                    like the least clickable thing on the row.
                  */}
                  <Link
                    href={`/employer/${companySlug}/jobs/${job.id}/applicants`}
                    className="text-primary mt-2 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    <Users className="size-4" aria-hidden="true" />
                    <span data-numeric>
                      {job.applicationCount}{" "}
                      {job.applicationCount === 1 ? "applicant" : "applicants"}
                    </span>
                  </Link>
                </div>

                <JobRowActions
                  companySlug={companySlug}
                  jobId={job.id}
                  slug={job.slug}
                  status={job.status}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
