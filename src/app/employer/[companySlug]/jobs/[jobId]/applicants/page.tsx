import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, ArrowLeft } from "lucide-react";
import { requireCompany } from "@/server/auth/guard";
import { listForCompany } from "@/server/repos/application.repo";
import { findForCompany } from "@/server/repos/job.repo";
import { EmptyState } from "@/components/data/empty-state";
import { Eyebrow } from "@/components/ui/section";
import { JobStatusBadge } from "@/components/job/status-badge";
import { ApplicantCard } from "../../../applicants/applicant-card";

export const metadata: Metadata = {
  title: "Job applicants",
  robots: { index: false, follow: false },
};

export default async function JobApplicantsPage({
  params,
}: {
  params: Promise<{ companySlug: string; jobId: string }>;
}) {
  const { companySlug, jobId } = await params;
  const ctx = await requireCompany(companySlug);

  // Scoped lookup: another company's jobId 404s rather than leaking its title.
  const job = await findForCompany(ctx, jobId);
  if (!job) notFound();

  const applications = await listForCompany(ctx, { jobId });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <Link
          href={`/employer/${companySlug}/jobs`}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All jobs
        </Link>

        <Eyebrow className="mt-6">Applicants</Eyebrow>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="display text-display-sm">{job.title}</h1>
          <JobStatusBadge status={job.status} />
        </div>

        <p className="text-muted-foreground mt-3 text-sm" data-numeric>
          {applications.length} {applications.length === 1 ? "applicant" : "applicants"}
        </p>
      </header>

      {applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants yet"
          description="Share the public link to this job — posting it in relevant Telegram channels and groups is the fastest way to get applicants."
          action={{ href: `/jobs/${job.slug}`, label: "View public listing" }}
        />
      ) : (
        <ul className="space-y-3">
          {applications.map((application) => (
            <li key={application.id}>
              <ApplicantCard companySlug={companySlug} application={application} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
