import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { jobSearchSchema } from "@/lib/schemas/job";
import { searchPublicJobs } from "@/server/repos/job.repo";
import { JobCard } from "@/components/job/job-card";
import { JobFilters } from "@/components/job/job-filters";
import { EmptyState } from "@/components/data/empty-state";
import { Eyebrow } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Browse jobs in Ethiopia",
  description:
    "Search current vacancies across Ethiopia by category, region, and job type. Apply directly on Z-Jobs.",
  alternates: { canonical: "/jobs" },
};

const PER_PAGE = 20;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  // Unparseable filters fall back to defaults rather than 500ing — these are
  // user-editable URLs and people do mangle them.
  const parsed = jobSearchSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : jobSearchSchema.parse({});

  const { jobs, total } = await searchPublicJobs({
    q: filters.q,
    categorySlug: filters.category,
    region: filters.region,
    employmentType: filters.type,
    experienceLevel: filters.level,
    remoteOnly: filters.remote,
    skip: (filters.page - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <Eyebrow>{filters.q ? "Search results" : "All openings"}</Eyebrow>

        <h1 className="display text-display-sm mt-4">
          {filters.q ? (
            <>
              Jobs matching <span className="display-accent">{filters.q}</span>
            </>
          ) : (
            "Browse jobs"
          )}
        </h1>

        <p className="text-muted-foreground mt-3 text-sm">
          {total === 0
            ? "No vacancies match your filters."
            : `${total.toLocaleString("en-US")} ${total === 1 ? "vacancy" : "vacancies"} available.`}
        </p>
      </header>

      {/*
        The filter bar sticks under the header so it stays reachable while
        scrolling a long result set — on a board, re-filtering is the most
        common next action after scanning, and scrolling back up to reach the
        controls is the main friction in every competitor.

        The offset is breakpoint-specific because the header is taller on
        mobile, where the primary nav drops to a second row. A single `top-16`
        would let the filters slide under it.
      */}
      <div className="bg-background/90 border-border sticky top-[6.4rem] z-20 -mx-4 mt-8 border-b px-4 py-4 backdrop-blur-md sm:top-16 sm:-mx-6 sm:px-6">
        <JobFilters />
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          className="mt-12"
          icon={SearchX}
          title="No jobs match those filters"
          description="Try removing a filter or searching a broader term. New vacancies are posted regularly."
          action={{ href: "/jobs", label: "Clear filters" }}
        />
      ) : (
        <>
          <ul className="mt-8 grid gap-3 lg:grid-cols-2">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <Pagination page={filters.page} totalPages={totalPages} params={raw} />
          )}
        </>
      )}
    </div>
  );
}

/**
 * Offset pagination with real links: crawlable and shareable, which cursors
 * are not. Deep offsets are bounded by the page cap in the schema.
 */
function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | string[] | undefined>;
}) {
  function href(target: number) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === "string" && k !== "page") next.set(k, v);
    }
    next.set("page", String(target));
    return `/jobs?${next.toString()}`;
  }

  const linkClass =
    "border-border bg-card hover:border-primary hover:text-primary inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors";

  return (
    <nav
      className="border-border mt-12 flex items-center justify-between gap-4 border-t pt-6"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass} rel="prev">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-muted-foreground text-sm" data-numeric>
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={href(page + 1)} className={linkClass} rel="next">
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
