"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { changeApplicationStatus } from "@/app/employer/_actions";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/job/status-badge";

/**
 * Valid next steps per status, mirroring the server-side transition map. The
 * server is authoritative — this only avoids offering buttons that would be
 * rejected.
 */
const NEXT_STEPS: Record<string, { value: string; label: string }[]> = {
  SUBMITTED: [
    { value: "SHORTLISTED", label: "Shortlist" },
    { value: "REJECTED", label: "Reject" },
  ],
  VIEWED: [
    { value: "SHORTLISTED", label: "Shortlist" },
    { value: "REJECTED", label: "Reject" },
  ],
  SHORTLISTED: [
    { value: "INTERVIEW", label: "Move to interview" },
    { value: "REJECTED", label: "Reject" },
  ],
  INTERVIEW: [
    { value: "OFFER", label: "Make offer" },
    { value: "REJECTED", label: "Reject" },
  ],
  OFFER: [
    { value: "HIRED", label: "Mark hired" },
    { value: "REJECTED", label: "Reject" },
  ],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

type Application = {
  id: string;
  status: string;
  coverLetter: string | null;
  createdAt: Date;
  job: { title: string };
  seeker: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
};

/** Two-letter monogram. No avatar uploads exist for seekers yet, and a generic
 *  person glyph repeated down a list adds noise without adding identity. */
function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function ApplicantCard({
  companySlug,
  application,
}: {
  companySlug: string;
  application: Application;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const steps = NEXT_STEPS[application.status] ?? [];
  const name = `${application.seeker.firstName} ${application.seeker.lastName}`;

  function move(status: string) {
    startTransition(async () => {
      const result = await changeApplicationStatus(companySlug, application.id, status);
      if (result.ok) {
        router.refresh();
        toast.success(
          `Moved to ${status.toLowerCase()}. The candidate has been emailed.`,
        );
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <article className="border-border bg-card rounded-xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-4">
        <div className="flex min-w-0 gap-4">
          <span
            aria-hidden="true"
            className="bg-primary-wash text-primary grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold"
          >
            {initials(application.seeker.firstName, application.seeker.lastName)}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{name}</h2>
              <ApplicationStatusBadge status={application.status} />
            </div>

            <p className="text-muted-foreground mt-1 text-sm">
              Applied for{" "}
              <span className="text-foreground font-medium">{application.job.title}</span>{" "}
              ·{" "}
              <time dateTime={application.createdAt.toISOString()}>
                {application.createdAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </time>
            </p>

            <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              <a
                href={`mailto:${application.seeker.email}`}
                className="hover:text-primary flex items-center gap-1.5 transition-colors"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{application.seeker.email}</span>
              </a>
              {application.seeker.phone && (
                <a
                  href={`tel:${application.seeker.phone}`}
                  className="hover:text-primary flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                  {application.seeker.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {steps.length > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {pending && (
              <Loader2
                className="text-muted-foreground size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {steps.map((step) => (
              <Button
                key={step.value}
                size="sm"
                // Advancing is the primary action; rejecting is deliberately
                // the quieter of the two and never the destructive red — this
                // is a routine decision, not a dangerous one.
                variant={step.value === "REJECTED" ? "ghost" : "primary"}
                disabled={pending}
                aria-busy={pending}
                onClick={() => {
                  move(step.value);
                }}
              >
                {step.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {application.coverLetter && (
        <details className="group border-border mt-4 border-t pt-3">
          <summary className="text-primary flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium">
            <ChevronDown
              className="size-4 transition-transform duration-200 group-open:rotate-180"
              aria-hidden="true"
            />
            Read their message
          </summary>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed whitespace-pre-wrap">
            {application.coverLetter}
          </p>
        </details>
      )}
    </article>
  );
}
