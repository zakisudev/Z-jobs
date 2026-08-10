import type { CompanyRole, UserRole } from "@prisma/client";

/** The authenticated user, as carried through every guarded call. */
export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
};

export type AuthCtx = {
  user: SessionUser;
  sessionId: string;
};

/**
 * An AuthCtx narrowed to one tenant. Repo functions take this as their FIRST
 * argument and splice `companyId` into every `where` clause, which is what
 * makes cross-tenant reads structurally impossible rather than a matter of
 * remembering to add a filter.
 */
export type TenantCtx = AuthCtx & {
  companyId: string;
  companySlug: string;
  /**
   * The display name. The membership lookup already selects it, so carrying it
   * here costs no extra query and stops the employer console from addressing
   * people by their URL slug — "green-valley-agro" where "Green Valley Agro"
   * belongs.
   */
  companyName: string;
  companyRole: CompanyRole;
};

/** Company roles ordered by privilege, for `atLeast`-style checks. */
export const COMPANY_ROLE_RANK: Record<CompanyRole, number> = {
  RECRUITER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function hasCompanyRole(ctx: TenantCtx, minimum: CompanyRole): boolean {
  return COMPANY_ROLE_RANK[ctx.companyRole] >= COMPANY_ROLE_RANK[minimum];
}
