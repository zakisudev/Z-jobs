import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Every empty state must offer the next action.
 *
 * The old app's was a single unstyled sentence — "No Jobs registered yet" —
 * with no icon, no explanation, and nothing to click. Worse, it rendered before
 * data arrived and on fetch failure, so "empty" and "broken" looked identical.
 * That is why `EmptyState` and the error boundary are separate components here:
 * a failed load must never render as an empty one.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: string; label: string } | undefined;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <span className="bg-primary-wash text-primary grid size-12 place-items-center rounded-full">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h2 className="display mt-5 text-xl">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed text-pretty">
        {description}
      </p>
      {action && (
        <Button asChild className="mt-6" variant="outline">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
