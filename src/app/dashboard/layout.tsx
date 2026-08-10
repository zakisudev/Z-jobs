import Link from "next/link";
import { Building2 } from "lucide-react";
import { requireUser } from "@/server/auth/guard";
import { listForUser } from "@/server/repos/membership.repo";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

/**
 * Wraps every seeker route in the shell. Auth is resolved once here rather than
 * per page — `getAuth` is React-cached, so a child page calling `requireUser`
 * again costs no extra query.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireUser("/dashboard");

  // Anyone who belongs to a company gets a way back into the employer area;
  // without it the two halves of the product are unreachable from each other.
  const memberships = await listForUser(ctx.user.id);
  const employer = memberships[0];

  return (
    <AppShell
      nav={{ type: "seeker" }}
      user={ctx.user}
      actions={
        employer ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/employer/${employer.company.slug}`}>
              <Building2 aria-hidden="true" />
              <span className="hidden sm:inline">Employer</span>
            </Link>
          </Button>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
