import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Users, Eye, Plus, ArrowRight } from "lucide-react";
import { requireCompany } from "@/server/auth/guard";
import { listForCompany } from "@/server/repos/job.repo";
import { countForCompany } from "@/server/repos/application.repo";
import { getWallet } from "@/server/repos/company.repo";
import { FREE_TIER_ACTIVE_JOBS } from "@/server/services/job.service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/data/empty-state";
import { Eyebrow } from "@/components/ui/section";
import { JobStatusBadge } from "@/components/job/status-badge";

export const metadata: Metadata = {
  title: "Employer dashboard",
  robots: { index: false, follow: false },
};

export default async function EmployerDashboard({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const ctx = await requireCompany(companySlug);

  const [jobs, applicantCount, wallet] = await Promise.all([
    listForCompany(ctx),
    countForCompany(ctx),
    getWallet(ctx.companyId),
  ]);

  const active = jobs.filter((j) => j.status === "PUBLISHED");
  const views = jobs.reduce((sum, j) => sum + j.viewCount, 0);
  const credits = wallet?.jobPostBalance ?? 0;

  /**
   * Mirrors `publishWithQuota`: a credit is spent first and lifts the free
   * limit entirely, so the active-listing cap only bites at zero credits.
   * Stating it the other way round told this company it was "2 of 1 listings
   * used" while it was in fact free to publish.
   */
  const blocked = credits === 0 && active.length >= FREE_TIER_ACTIVE_JOBS;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Eyebrow>Employer</Eyebrow>
          {/* The company's own name, not its URL slug. */}
          <h1 className="display text-display-sm mt-4 truncate">{ctx.companyName}</h1>
        </div>

        <Button asChild variant="accent" className="shrink-0">
          <Link href={`/employer/${companySlug}/jobs/new`}>
            <Plus aria-hidden="true" />
            Post a job
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat icon={Briefcase} label="Active jobs" value={active.length} />
        <Stat
          icon={Users}
          label="Applicants"
          value={applicantCount}
          href={`/employer/${companySlug}/applicants`}
        />
        <Stat icon={Eye} label="Job views" value={views} />
      </div>

      {/*
        The plan line states the limit and what to do about it in the same
        breath. Previously it reported a credit balance with no indication of
        whether the employer was actually blocked, so the quota rejection only
        ever surfaced as a toast after a failed publish.
      */}
      <section className="border-border bg-sunken rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div>
            <p className="text-sm font-semibold">
              {blocked ? "Publishing is paused" : "You can publish now"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {blocked
                ? `The free plan allows ${FREE_TIER_ACTIVE_JOBS} active listing. Close one to publish another, or add a job-post credit.`
                : credits > 0
                  ? "Publishing spends one job-post credit."
                  : `Your first ${FREE_TIER_ACTIVE_JOBS} active listing is free.`}
            </p>
          </div>
          <p className="text-muted-foreground shrink-0 text-sm" data-numeric>
            {credits} {credits === 1 ? "credit" : "credits"} · {active.length} active
          </p>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <Eyebrow className="flex-1">Your listings</Eyebrow>
          {jobs.length > 0 && (
            <Link
              href={`/employer/${companySlug}/jobs`}
              className="text-primary group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline"
            >
              Manage all
              <ArrowRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={Briefcase}
            title="No jobs yet"
            description="Post your first vacancy and it will appear on the public job board straight away."
            action={{ href: `/employer/${companySlug}/jobs/new`, label: "Post a job" }}
          />
        ) : (
          <ul className="mt-5 space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <li key={job.id}>
                <Link
                  href={`/employer/${companySlug}/jobs/${job.id}/applicants`}
                  className="border-border bg-card hover:border-border-strong flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border p-4 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{job.title}</p>
                    <p className="text-muted-foreground mt-1 text-xs" data-numeric>
                      {job.applicationCount}{" "}
                      {job.applicationCount === 1 ? "applicant" : "applicants"} ·{" "}
                      {job.viewCount} {job.viewCount === 1 ? "view" : "views"}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/**
 * A stat tile becomes a link when there is somewhere useful to go. Applicants
 * is the number employers actually act on, so it opens the pipeline rather
 * than sitting there as a figure they then have to go find in the nav.
 */
function Stat({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number;
  href?: string;
}) {
  const body = (
    <>
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label}
      </div>
      <p data-numeric className="display mt-3 text-4xl leading-none">
        {value.toLocaleString("en-US")}
      </p>
    </>
  );

  const className = "border-border bg-card block rounded-xl border p-5";

  if (!href) return <div className={className}>{body}</div>;

  return (
    <Link href={href} className={`${className} hover:border-primary transition-colors`}>
      {body}
    </Link>
  );
}
