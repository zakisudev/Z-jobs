import { cn } from "@/lib/utils";

/**
 * Loading placeholder.
 *
 * Skeletons, not spinners: a skeleton that matches the real layout's geometry
 * avoids the layout shift a spinner causes when content replaces it, and reads
 * as faster. The old app's only loading affordance was a 40px SVG swapped in
 * for a button, which shifted everything below it.
 *
 * `aria-hidden` because the loading state is announced once by the region's
 * aria-busy, not once per placeholder bar.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

/** Matches the geometry of a list row so the swap to real content is silent. */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-3">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="border-border flex gap-4 rounded-lg border p-4">
          <Skeleton className="size-12 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
