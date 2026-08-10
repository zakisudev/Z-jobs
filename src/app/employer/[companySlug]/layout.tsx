import { requireCompany } from "@/server/auth/guard";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Every employer route resolves the tenant here. `requireCompany` 404s (never
 * 403s) when the user is not a member, so probing slugs cannot reveal which
 * companies exist.
 */
export default async function EmployerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const ctx = await requireCompany(companySlug);

  return (
    <AppShell nav={{ type: "employer", companySlug: ctx.companySlug }} user={ctx.user}>
      {children}
    </AppShell>
  );
}
