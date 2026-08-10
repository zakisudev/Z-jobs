import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { CompanyRole } from "@prisma/client";
import { readSession } from "./session";
import { ForbiddenError } from "@/lib/errors";
import type { AuthCtx, TenantCtx } from "./context";
import * as memberships from "@/server/repos/membership.repo";

/**
 * Every Server Action, Route Handler, and protected page begins with one of
 * these. Nothing reads the session directly.
 *
 * The old app's equivalent was `localStorage.getItem("userInfo")` on the client
 * plus a `protect` middleware that trusted a 30-day JWT. Two of its bugs are
 * structurally impossible here:
 *   - Privilege escalation via admin edit: session creation is reachable only
 *     from the login/register paths, so no admin action can mint a cookie for
 *     another user.
 *   - Decorative verification: `emailVerifiedAt` is enforced by
 *     `requireVerified`, not merely returned to the client.
 */

/**
 * React-cached, so ten callers in one render tree cost one database round trip.
 * The cache is per-request; it never leaks between users.
 */
export const getAuth = cache(async (): Promise<AuthCtx | null> => {
  const session = await readSession();
  if (!session) return null;

  return {
    sessionId: session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      emailVerified: session.user.emailVerifiedAt !== null,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
    },
  };
});

export async function requireUser(nextPath?: string): Promise<AuthCtx> {
  const ctx = await getAuth();
  if (!ctx) {
    const next = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${next}`);
  }
  return ctx;
}

/**
 * Gates the actions that must not happen from an unverified address: publishing
 * a job, applying to one, and paying.
 */
export async function requireVerified(nextPath?: string): Promise<AuthCtx> {
  const ctx = await requireUser(nextPath);
  if (!ctx.user.emailVerified) redirect("/verify-email/pending");
  return ctx;
}

/**
 * The single chokepoint for tenant access.
 *
 * Resolves slug -> membership on every request; the URL segment is only a hint.
 * Non-membership 404s rather than 403s, so probing slugs cannot be used to
 * discover which companies exist.
 */
export async function requireCompany(
  companySlug: string,
  allowed: CompanyRole[] = ["OWNER", "ADMIN", "RECRUITER"],
): Promise<TenantCtx> {
  const ctx = await requireVerified(`/employer/${companySlug}`);
  const membership = await memberships.findBySlugForUser(ctx.user.id, companySlug);

  if (!membership) notFound();
  if (!allowed.includes(membership.role)) {
    throw new ForbiddenError("Your role in this company does not allow that action.");
  }

  return {
    ...ctx,
    companyId: membership.companyId,
    companySlug: membership.company.slug,
    companyName: membership.company.name,
    companyRole: membership.role,
  };
}

/** Platform staff. 404s rather than 403s so /admin is invisible to everyone else. */
export async function requireAdmin(): Promise<AuthCtx> {
  const ctx = await requireUser();
  if (ctx.user.role !== "ADMIN") notFound();
  return ctx;
}
