import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, FileText, Bookmark, UserRound, Search } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { EmptyState } from "@/components/data/empty-state";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false, follow: false },
};

/**
 * Seeker overview. The stat tiles read zero until applications and saved jobs
 * are wired; the layout exists now so the shell is exercised.
 */
export default async function DashboardPage() {
  const ctx = await requireUser();

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header>
        <Eyebrow>Your board</Eyebrow>
        <h1 className="display text-display-sm mt-4">
          Welcome back, {ctx.user.firstName}
        </h1>
        <p className="text-muted-foreground mt-3 text-sm">
          Track every application and pick up where you left off.
        </p>
      </header>

      {!ctx.user.emailVerified && (
        <div
          role="status"
          className="border-warning/40 bg-warning-wash flex items-start gap-3 rounded-xl border p-5"
        >
          <AlertTriangle
            className="text-warning mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 text-sm">
            <p className="font-semibold">Confirm your email address</p>
            <p className="text-muted-foreground mt-1 leading-relaxed">
              You need a confirmed email before you can apply to jobs.
            </p>
            <Link
              href="/verify-email/pending"
              className="text-primary mt-3 inline-block font-medium hover:underline"
            >
              Resend the confirmation link
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Applications" value={0} icon={FileText} />
        <StatTile label="Saved jobs" value={0} icon={Bookmark} />
        <StatTile label="Profile complete" value="0%" icon={UserRound} />
      </div>

      <section>
        <Eyebrow>Recent activity</Eyebrow>
        <div className="mt-5">
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="When you apply to a job it will appear here, with its status as the employer moves it along."
            action={{ href: "/jobs", label: "Browse jobs" }}
          />
        </div>
      </section>

      {/*
        The next action is always visible. An overview that only reports zeros
        gives a new account nothing to do, which is precisely when people leave
        and do not come back.
      */}
      <section className="bg-primary text-primary-foreground grain relative overflow-hidden rounded-xl px-6 py-8 sm:px-8">
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="display text-2xl">Ready to find your next role?</h2>
            <p className="mt-2 text-sm opacity-90">
              New vacancies are posted across every region each week.
            </p>
          </div>
          <Button asChild variant="accent" className="shrink-0">
            <Link href="/jobs">
              <Search aria-hidden="true" />
              Browse jobs
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: typeof FileText;
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label}
      </div>
      <p data-numeric className="display mt-3 text-4xl leading-none">
        {value}
      </p>
    </div>
  );
}
