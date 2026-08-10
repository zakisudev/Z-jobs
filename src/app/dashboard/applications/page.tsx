import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { listForSeeker } from "@/server/repos/application.repo";
import { EmptyState } from "@/components/data/empty-state";

export const metadata: Metadata = {
  title: "Applications",
  robots: { index: false, follow: false },
};

const STATUS_STYLE: Record<string, string> = {
  SUBMITTED: "bg-primary/10 text-primary",
  VIEWED: "bg-muted text-muted-foreground",
  SHORTLISTED: "bg-success/10 text-success",
  INTERVIEW: "bg-success/10 text-success",
  OFFER: "bg-success/15 text-success",
  HIRED: "bg-success/20 text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Sent",
  VIEWED: "Viewed by employer",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

export default async function ApplicationsPage() {
  const ctx = await requireUser();
  const applications = await listForSeeker(ctx);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Every job you&apos;ve applied to, and where it stands.
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Apply to a job and you'll be able to follow its progress here — from sent through to an offer."
          action={{ href: "/jobs", label: "Browse jobs" }}
        />
      ) : (
        <ul className="space-y-3">
          {applications.map((application) => (
            <li
              key={application.id}
              className="border-border bg-card rounded-lg border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-medium">
                    {/* Expired or closed jobs 404 publicly, so only link while
                        the listing is still live. */}
                    {application.job.status === "PUBLISHED" ? (
                      <Link
                        href={`/jobs/${application.job.slug}`}
                        className="hover:underline"
                      >
                        {application.job.title}
                      </Link>
                    ) : (
                      application.job.title
                    )}
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {application.job.company.name} ·{" "}
                    {application.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${STATUS_STYLE[application.status] ?? "bg-muted"}`}
                >
                  {STATUS_LABEL[application.status] ?? application.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
