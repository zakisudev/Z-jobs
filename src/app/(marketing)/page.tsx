import Link from "next/link";
import { Search, Building2, ShieldCheck, LineChart } from "lucide-react";
import { searchPublicJobs } from "@/server/repos/job.repo";
import { listHiringCompanies } from "@/server/repos/company.repo";
import { JOB_CATEGORIES } from "@/lib/constants/categories";
import { JobCard } from "@/components/job/job-card";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeader } from "@/components/ui/section";

/** Homepage is ISR: the latest-jobs rail changes as employers post. */
export const revalidate = 300;

/** Shortcuts that cover most first searches on a board this size. */
const QUICK_SEARCHES = [
  { label: "Remote", href: "/jobs?remote=true" },
  { label: "Addis Ababa", href: "/jobs?region=addis-ababa" },
  { label: "Engineering", href: "/jobs?category=engineering" },
  { label: "Accounting", href: "/jobs?category=accounting-finance" },
  { label: "Health", href: "/jobs?category=healthcare" },
];

export default async function HomePage() {
  const [{ jobs, total }, companies] = await Promise.all([
    searchPublicJobs({ skip: 0, take: 6 }),
    listHiringCompanies(60),
  ]);

  const verifiedCount = companies.filter((c) => c.verification === "VERIFIED").length;

  return (
    <>
      <Hero total={total} employers={companies.length} verified={verifiedCount} />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeader
          eyebrow="Latest openings"
          title="Fresh on the board"
          {...(jobs.length > 0 && {
            action: { href: "/jobs", label: "View all jobs" },
          })}
        />

        {jobs.length === 0 ? (
          // Honest empty state rather than fake placeholder listings — an empty
          // board is the real cold-start problem, not something to paper over.
          <div className="border-border mt-8 rounded-xl border border-dashed px-6 py-14 text-center">
            <Building2
              className="text-muted-foreground mx-auto size-8"
              aria-hidden="true"
            />
            <p className="mt-4 font-semibold">No jobs posted yet</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm text-pretty">
              Be the first employer on the board. Posting a vacancy is free while we grow.
            </p>
            <Button asChild className="mt-6" variant="accent">
              <Link href="/register?role=EMPLOYER">Post the first job</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Promise_ />

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <SectionHeader
          eyebrow="By field"
          title="Browse by category"
          description="Every listing is filed under one field, so a search never buries a role in the wrong place."
        />

        <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {JOB_CATEGORIES.slice(0, 12).map((c) => (
            <li key={c.slug}>
              <Link
                href={`/jobs?category=${c.slug}`}
                className="border-border bg-card hover:border-primary hover:text-primary flex h-full items-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <EmployerBand />
    </>
  );
}

/**
 * The hero is asymmetric on purpose. A centred headline over a centred search
 * box is the exact composition every job board template ships, and it wastes
 * the right-hand column on nothing. Here that column carries the board's real
 * numbers, which is also the only honest proof a new marketplace has.
 */
function Hero({
  total,
  employers,
  verified,
}: {
  total: number;
  employers: number;
  verified: number;
}) {
  return (
    <section className="border-border bg-sunken grain relative overflow-hidden border-b">
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <Eyebrow>Ethiopia&apos;s job board</Eyebrow>

          <h1 className="display text-display mt-6">
            Work that <span className="display-accent">holds</span>.
          </h1>

          <p className="text-muted-foreground mt-6 max-w-lg text-lg leading-relaxed text-pretty">
            Roles worth staying in — from verified employers across the country. Search
            once, apply directly, and track every application in one place.
          </p>

          <form
            action="/jobs"
            className="mt-10 flex max-w-xl flex-col gap-2 sm:flex-row"
            role="search"
          >
            <div className="relative flex-1">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <label htmlFor="home-search" className="sr-only">
                Search jobs by keyword
              </label>
              <input
                id="home-search"
                name="q"
                type="search"
                placeholder="Job title, skill, or company"
                className="border-border-strong bg-card focus:border-primary h-12 w-full rounded-md border pr-4 pl-11 text-base transition-colors outline-none sm:text-sm"
              />
            </div>
            <Button type="submit" size="lg" className="shrink-0">
              Search
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Popular:</span>
            {QUICK_SEARCHES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="border-border bg-card text-muted-foreground hover:border-primary hover:text-primary rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {/* The numbers panel. Rendered only once there is something true to
            say — a board advertising "0 open roles" argues against itself. */}
        {total > 0 && (
          <div className="lg:col-span-5 lg:pl-8">
            <div className="border-border bg-card rounded-xl border p-6 shadow-sm sm:p-8">
              <Eyebrow>The board today</Eyebrow>

              <dl className="mt-6 space-y-6">
                <Stat label="Open roles" value={total} />
                <Stat label="Employers hiring" value={employers} />
                {verified > 0 && <Stat label="Verified employers" value={verified} />}
              </dl>

              <p className="border-border text-muted-foreground mt-8 border-t pt-5 text-xs leading-relaxed">
                Counts update as employers post and listings expire. Nothing here is
                padded with stale vacancies.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Label, leader rule, figure — set the way a contents page sets a page number.
 * The rule is what stops the pair from reading as two unrelated bits of text
 * once the figures have different digit counts.
 */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="text-muted-foreground shrink-0 text-sm">{label}</dt>
      <span
        className="border-border min-w-4 flex-1 border-b border-dotted"
        aria-hidden="true"
      />
      <dd data-numeric className="display shrink-0 text-4xl leading-none">
        {value.toLocaleString("en-US")}
      </dd>
    </div>
  );
}

/**
 * Named with a trailing underscore because `Promise` is a global — shadowing
 * it inside this module would break any later `Promise.all` in the file.
 */
function Promise_() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Verified employers",
      body: "Companies are checked before they carry a verified mark, so a listing is traceable to a real business.",
    },
    {
      icon: LineChart,
      title: "Status you can see",
      body: "Every application shows where it actually stands, instead of disappearing into an inbox.",
    },
    {
      icon: Building2,
      title: "Built for Ethiopia",
      body: "Salaries in birr, every region covered, and Amharic rendered properly rather than as boxes.",
    },
  ];

  return (
    <section className="border-border bg-sunken border-y">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <ul className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {items.map((it) => (
            <li key={it.title}>
              <it.icon className="text-primary size-5" aria-hidden="true" />
              <h2 className="mt-4 font-semibold">{it.title}</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
                {it.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function EmployerBand() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="bg-primary text-primary-foreground grain relative overflow-hidden rounded-2xl px-6 py-12 sm:px-12 sm:py-16">
        <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-lg">
            <h2 className="display text-display-sm">Hiring in Ethiopia?</h2>
            <p className="mt-4 leading-relaxed text-pretty opacity-90">
              Put your vacancy in front of candidates who are actually looking. Posting is
              free while we grow the board.
            </p>
          </div>

          <Button asChild variant="accent" size="lg" className="shrink-0">
            <Link href="/register?role=EMPLOYER">Post a job</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
