import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

/**
 * Route-level loading state. The geometry deliberately mirrors the real page
 * (heading, three stat tiles, a list) so content swapping in causes no shift.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      <SkeletonList rows={3} />
    </div>
  );
}
