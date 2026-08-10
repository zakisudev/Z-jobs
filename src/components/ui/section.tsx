import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The editorial section label — small caps, tracked out, trailed by a gold
 * rule that runs to the edge of the column.
 *
 * This is the one motif repeated across home, browse, detail, and dashboard.
 * It is what makes four unrelated screens read as one publication, and it does
 * the job that a heavier card border would otherwise be asked to do.
 */
export function Eyebrow({ children, className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("eyebrow", className)} {...props}>
      {children}
    </p>
  );
}

/**
 * An eyebrow plus a heading, with an optional "view all" on the same baseline.
 *
 * `as` exists because heading rank is a document-structure decision, not a
 * styling one: the same visual treatment is an h2 on the homepage and an h1 on
 * a listing page, and hardcoding either would break the outline on one of them.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  as: Heading = "h2",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  action?: { href: string; label: string };
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <Heading className="display text-3xl sm:text-4xl">{title}</Heading>
          {description && (
            <p className="text-muted-foreground mt-2 max-w-prose text-sm text-pretty">
              {description}
            </p>
          )}
        </div>

        {action && (
          <Link
            href={action.href}
            className="text-primary group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium hover:underline"
          >
            {action.label}
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        )}
      </div>
    </div>
  );
}
