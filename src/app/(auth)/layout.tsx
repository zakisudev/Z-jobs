import Link from "next/link";
import { ShieldCheck, LineChart, MapPin } from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";

/**
 * Split layout: the form on the left, the argument for filling it in on the
 * right. A lone centred card gives a first-time visitor no reason to finish
 * signing up, and this is the exact step where a new marketplace loses people.
 *
 * The right panel is `hidden lg:flex` — on mobile it would push the form below
 * the fold, which costs more than the copy earns.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="flex flex-1 flex-col">
        <header className="px-4 py-6 sm:px-8">
          <Wordmark />
        </header>

        <main
          id="main"
          className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8"
        >
          <div className="w-full max-w-md">{children}</div>
        </main>

        <footer className="text-muted-foreground px-4 py-6 text-xs sm:px-8">
          © {new Date().getFullYear()} Z-Jobs
        </footer>
      </div>

      <aside className="bg-primary text-primary-foreground grain relative hidden w-full max-w-xl overflow-hidden lg:flex lg:flex-col lg:justify-center">
        <div className="relative z-10 px-14 py-16">
          <p className="text-2xs font-semibold tracking-[0.14em] uppercase opacity-70">
            Z-Jobs
          </p>

          <p className="display mt-6 text-4xl leading-tight">
            One account, from the first search to the signed offer.
          </p>

          <ul className="mt-12 space-y-8">
            <Point
              icon={ShieldCheck}
              title="Verified employers"
              body="Companies are checked before they carry a verified mark."
            />
            <Point
              icon={LineChart}
              title="Every application tracked"
              body="See exactly where each one stands, instead of guessing."
            />
            <Point
              icon={MapPin}
              title="Every region covered"
              body="From Addis to Tigray, plus remote roles open to the world."
            />
          </ul>

          <p className="mt-16 text-sm opacity-70">
            Browsing first?{" "}
            <Link href="/jobs" className="underline underline-offset-4">
              See the open roles
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}

function Point({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-4">
      <Icon className="mt-0.5 size-5 shrink-0 opacity-80" aria-hidden="true" />
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-pretty opacity-80">{body}</p>
      </div>
    </li>
  );
}
