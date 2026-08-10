import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Briefcase,
  Banknote,
  CalendarClock,
  BadgeCheck,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import {
  findPublicBySlug,
  listSimilar,
  incrementViewCount,
} from "@/server/repos/job.repo";
import { hasApplied } from "@/server/repos/application.repo";
import { getAuth } from "@/server/auth/guard";
import { formatSalaryRange } from "@/lib/money";
import { getRegion } from "@/lib/constants/regions";
import { formatJobLocation } from "@/lib/location";
import { env } from "@/lib/env";
import { JobCard } from "@/components/job/job-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeader } from "@/components/ui/section";
import { ApplyPanel } from "./apply-panel";

/** ISR: job pages are read far more than they change. */
export const revalidate = 600;

const TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  TEMPORARY: "Temporary",
  INTERNSHIP: "Internship",
  VOLUNTEER: "Volunteer",
};

const LEVEL_LABEL: Record<string, string> = {
  INTERN: "Intern",
  ENTRY: "Entry level",
  JUNIOR: "Junior",
  MID: "Mid level",
  SENIOR: "Senior",
  LEAD: "Lead",
  EXECUTIVE: "Executive",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await findPublicBySlug(slug);

  if (!job) return { title: "Job not found", robots: { index: false, follow: false } };

  const region = getRegion(job.region);
  const location = job.isRemote ? "Remote" : (job.city ?? region?.name ?? "Ethiopia");
  const title = `${job.title} at ${job.company.name} — ${location}`;
  const description =
    job.summary ??
    `${job.company.name} is hiring a ${job.title} in ${location}. Apply on Z-Jobs.`;

  return {
    title,
    description,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/jobs/${job.slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await findPublicBySlug(slug);

  // A closed, expired, or draft job 404s rather than rendering stale content —
  // Google demotes sites that keep serving expired postings.
  if (!job) notFound();

  const ctx = await getAuth();
  const existingApplication = ctx ? await hasApplied(ctx.user.id, job.id) : null;
  const similar = await listSimilar(job.id, null, 3);

  void incrementViewCount(job.id);

  const region = getRegion(job.region);
  const location = formatJobLocation(job);
  const salary = formatSalaryRange(job);

  /**
   * JobPosting structured data. This is what puts listings into Google Jobs,
   * which for a job board is usually a larger channel than social.
   *
   * `validThrough` must be in the future and the page must 404 once it passes —
   * both are guaranteed by the expiry cron plus the notFound() above.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: job.company.name,
      value: job.id,
    },
    datePosted: job.publishedAt?.toISOString(),
    ...(job.expiresAt && { validThrough: job.expiresAt.toISOString() }),
    employmentType: job.employmentType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      ...(job.company.website && { sameAs: job.company.website }),
    },
    ...(job.isRemote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "Ethiopia" },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              ...(job.city && { addressLocality: job.city }),
              ...(region && { addressRegion: region.name }),
              addressCountry: "ET",
            },
          },
        }),
    ...(job.salaryIsPublic && job.salaryMin !== null
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.salaryCurrency,
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salaryMin / 100,
              maxValue: (job.salaryMax ?? job.salaryMin) / 100,
              unitText: job.salaryPeriod,
            },
          },
        }
      : {}),
    directApply: true,
    url: `${env.APP_URL}/jobs/${job.slug}`,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <script
        type="application/ld+json"
        // Structured data must be machine-readable; React would escape it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        className="text-muted-foreground flex items-center gap-1 text-sm"
        aria-label="Breadcrumb"
      >
        <Link href="/jobs" className="hover:text-foreground transition-colors">
          Jobs
        </Link>
        <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="text-foreground truncate">{job.title}</span>
      </nav>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          {job.isFeatured && <Badge tone="accent">Featured</Badge>}
          <Badge tone="neutral">
            {TYPE_LABEL[job.employmentType] ?? job.employmentType}
          </Badge>
          {job.isRemote && <Badge tone="primary">Remote</Badge>}
        </div>

        <h1 className="display text-display-sm mt-5">{job.title}</h1>

        <p className="mt-4 flex flex-wrap items-center gap-2 text-base">
          <Link
            href={`/companies/${job.company.slug}`}
            className="text-primary font-medium hover:underline"
          >
            {job.company.name}
          </Link>
          {job.company.verification === "VERIFIED" && (
            <BadgeCheck className="text-primary size-4" aria-label="Verified employer" />
          )}
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{location}</span>
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-12">
        <div className="min-w-0 lg:col-span-2">
          <section aria-labelledby="about-heading">
            <Eyebrow id="about-heading">About this role</Eyebrow>
            {/* Plain text, rendered with preserved line breaks. Nothing here is
                treated as HTML, so a pasted <script> is inert. */}
            <div className="mt-5 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </section>

          <div id="apply" className="scroll-mt-24">
            <ApplyPanel
              jobId={job.id}
              jobTitle={job.title}
              isSignedIn={Boolean(ctx)}
              isVerified={ctx?.user.emailVerified ?? false}
              existingStatus={existingApplication?.status ?? null}
              slug={job.slug}
            />
          </div>
        </div>

        {/*
          The summary rail sticks on desktop so the salary, the deadline, and
          the apply button stay in view through a long description. On a job
          board that is the whole decision, and asking someone to scroll back
          up to find it is where competitors lose the application.
        */}
        <aside className="lg:col-span-1">
          <div className="border-border bg-card sticky top-24 rounded-xl border p-6 shadow-sm">
            {salary ? (
              <>
                <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                  Salary
                </p>
                <p data-numeric className="display mt-2 text-xl leading-snug text-pretty">
                  {salary}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Salary not disclosed by the employer.
              </p>
            )}

            <dl className="border-border mt-6 space-y-4 border-t pt-6">
              <Fact icon={MapPin} label="Location" value={location} />
              <Fact
                icon={Briefcase}
                label="Job type"
                value={TYPE_LABEL[job.employmentType] ?? job.employmentType}
              />
              <Fact
                icon={GraduationCap}
                label="Experience"
                value={LEVEL_LABEL[job.experienceLevel] ?? job.experienceLevel}
              />
              {job.expiresAt && (
                <Fact
                  icon={CalendarClock}
                  label="Apply before"
                  value={job.expiresAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
              )}
              {!salary && <Fact icon={Banknote} label="Salary" value="Not disclosed" />}
            </dl>

            {/* An in-page anchor, not a second form: the real apply control
                lives once in the main column, so there is no duplicated state
                and no question about which one submitted. */}
            <Button asChild variant="accent" full className="mt-6">
              <a href="#apply">Apply for this role</a>
            </Button>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-20">
          <SectionHeader
            eyebrow="Keep looking"
            title="Similar roles"
            action={{ href: "/jobs", label: "All jobs" }}
          />
          <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <li key={s.id}>
                <JobCard job={s} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-pretty">{value}</dd>
      </div>
    </div>
  );
}
