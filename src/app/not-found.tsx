import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Global 404. The old app had none — an unmatched URL rendered React Router's
 * default error screen, and `notFound` on the API returned 400 rather than 404.
 */
export default function NotFound() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <SearchX className="text-muted-foreground size-12" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground mt-2 text-sm text-pretty">
          This page doesn&apos;t exist, or the job listing it pointed to has closed.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/jobs">Browse jobs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
