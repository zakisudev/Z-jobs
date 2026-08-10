import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mark is an arch with a gold threshold — a doorway, not a briefcase.
 *
 * The briefcase it replaces is the single most generic icon in the category:
 * Indeed, LinkedIn, and every template job board reach for it, so it carried
 * no recognition value at all. An arch reads as a way in, echoes Aksumite
 * window forms, and stays legible at the 20px it renders at in the mobile
 * header — which ruled out anything with interior detail.
 */
export function WordmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 29V14a11 11 0 0 1 22 0v15Z" className="fill-primary" />
      <rect x="5" y="22.5" width="22" height="2.75" className="fill-accent" />
    </svg>
  );
}

/** The mark plus the name, linked home. */
export function Wordmark({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center gap-2.5", className)}
      aria-label="Z-Jobs — home"
    >
      <WordmarkIcon />
      <span className="display text-xl tracking-tight">Z-Jobs</span>
    </Link>
  );
}
