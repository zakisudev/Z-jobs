import Link from "next/link";
import { MapPin, Briefcase, Clock, BadgeCheck } from "lucide-react";
import { formatSalaryRange } from "@/lib/money";
import { formatJobLocation } from "@/lib/location";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  TEMPORARY: "Temporary",
  INTERNSHIP: "Internship",
  VOLUNTEER: "Volunteer",
};

/** Relative time, capped — "posted 400 days ago" reads worse than a date. */
function postedAgo(date: Date | null): string {
  if (!date) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export type JobCardData = {
  slug: string;
  title: string;
  summary: string | null;
  employmentType: string;
  city: string | null;
  region: string | null;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  salaryPeriod: string;
  salaryIsPublic: boolean;
  isFeatured: boolean;
  publishedAt: Date | null;
  company: { slug: string; name: string; verification: string };
};

/**
 * The unit the whole product is judged on — it appears on the homepage, in
 * search results, and under every job detail page.
 *
 * The spine (the 3px left edge) is the design's load-bearing idea: it goes
 * gold on a featured listing and forest on hover, which gives the row a
 * hierarchy and a hover state without a border colour change, a shadow lift,
 * or any of the geometry shifts that make a long list feel twitchy.
 */
export function JobCard({ job }: { job: JobCardData }) {
  const salary = formatSalaryRange(job);
  const location = formatJobLocation(job);

  return (
    <article
      className={cn(
        // `relative` anchors the stretched link pseudo-element below.
        // `isolate` keeps the spine's ::before under the link's ::after.
        "group bg-card relative isolate overflow-hidden rounded-lg",
        "border-border border transition-colors duration-200",
        "hover:border-border-strong focus-within:border-border-strong",
        // The spine.
        "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:transition-colors before:duration-200",
        job.isFeatured
          ? "before:bg-accent"
          : "group-hover:before:bg-primary group-focus-within:before:bg-primary before:bg-transparent",
      )}
    >
      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-pretty">
              {/* The whole card is reachable from this one link, so there is a
                  single tab stop per result rather than four. */}
              <Link
                href={`/jobs/${job.slug}`}
                className="group-hover:underline after:absolute after:inset-0"
              >
                {job.title}
              </Link>
            </h3>

            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
              <span className="truncate">{job.company.name}</span>
              {job.company.verification === "VERIFIED" && (
                <BadgeCheck
                  className="text-primary size-4 shrink-0"
                  aria-label="Verified employer"
                />
              )}
            </p>
          </div>

          {job.isFeatured && (
            <Badge tone="accent" className="shrink-0">
              Featured
            </Badge>
          )}
        </div>

        {job.summary && (
          <p className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed">
            {job.summary}
          </p>
        )}

        {/* The salary is pinned to the top-right of this block and the metadata
            wraps within its own column. Letting the whole row wrap instead put
            the salary inline on short locations and on its own line on long
            ones, so the figure landed in a different place on every card and
            the column stopped being scannable. Hairline rule above separates
            it from the prose without adding a nested box. */}
        <div className="border-border mt-4 flex items-baseline justify-between gap-x-4 border-t pt-3">
          <dl className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Location</dt>
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <dd>{location}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Employment type</dt>
              <Briefcase className="size-3.5 shrink-0" aria-hidden="true" />
              <dd>{TYPE_LABEL[job.employmentType] ?? job.employmentType}</dd>
            </div>
            {job.publishedAt && (
              <div className="flex items-center gap-1.5">
                <dt className="sr-only">Posted</dt>
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                <dd>{postedAgo(job.publishedAt)}</dd>
              </div>
            )}
          </dl>

          {salary && (
            <p
              data-numeric
              className="text-foreground shrink-0 text-sm font-semibold tracking-tight"
            >
              {salary}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
