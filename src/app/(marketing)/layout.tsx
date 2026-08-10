import Link from "next/link";
import { getAuth } from "@/server/auth/guard";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { Wordmark } from "@/components/layout/wordmark";

/** Public shell: header, footer, and the auth-aware CTA. */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
        <nav
          className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6"
          aria-label="Main"
        >
          <Wordmark />

          <div className="hidden items-center gap-1 sm:flex">
            <NavLink href="/jobs">Browse jobs</NavLink>
            <NavLink href="/companies">Companies</NavLink>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {ctx ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild variant="accent" size="sm">
                  <Link href="/register?role=EMPLOYER">Post a job</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        {/*
          On phones the primary nav does not fit beside the two auth buttons,
          so it drops to its own slim row rather than disappearing. It was
          previously `hidden sm:flex` with no replacement, which left "Browse
          jobs" — the main thing the site is for — unreachable from the header
          on mobile entirely.
        */}
        <nav
          className="border-border flex items-center gap-1 border-t px-2 py-1.5 sm:hidden"
          aria-label="Sections"
        >
          <NavLink href="/jobs">Browse jobs</NavLink>
          <NavLink href="/companies">Companies</NavLink>
        </nav>
      </header>

      <main id="main" className="min-w-0 flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}

/**
 * The footer closes the argument the homepage opens: this is a board for
 * Ethiopia, and the people on it are accounted for. The columns carry real
 * destinations only — a link that 404s costs more trust here than a thin
 * footer does.
 */
function Footer() {
  return (
    <footer className="border-border bg-sunken mt-24 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Wordmark />
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed text-pretty">
              Ethiopia&apos;s job board for roles worth staying in. Built here, open to
              the world.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-2">
            <FooterColumn
              title="Find work"
              links={[
                { href: "/jobs", label: "Browse jobs" },
                { href: "/jobs?remote=true", label: "Remote roles" },
                { href: "/companies", label: "Companies" },
              ]}
            />
            <FooterColumn
              title="Hire"
              links={[
                { href: "/register?role=EMPLOYER", label: "Post a job" },
                { href: "/login", label: "Employer sign in" },
              ]}
            />
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-12 flex flex-col gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Z-Jobs. Addis Ababa, Ethiopia.</p>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-2xs font-semibold tracking-[0.14em] uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
