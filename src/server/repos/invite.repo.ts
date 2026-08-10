import { db } from "@/server/db";

/**
 * Pending company invitations, read off AuthToken.
 *
 * Invites are not a separate table: `AuthToken` already carries `email`,
 * `companyId`, a `payload`, an expiry, and a `consumedAt` compare-and-swap, and
 * the schema reserves `COMPANY_INVITE` for exactly this. A parallel Invite
 * table would duplicate the expiry and single-use logic that token.repo already
 * gets right.
 */

/** Outstanding invitations for the team page — unconsumed and unexpired. */
export function listPendingForCompany(companyId: string) {
  return db.authToken.findMany({
    where: {
      companyId,
      type: "COMPANY_INVITE",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, email: true, payload: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Used to stop a second invite stacking up for the same address. */
export function findPendingForEmail(companyId: string, email: string) {
  return db.authToken.findFirst({
    where: {
      companyId,
      email,
      type: "COMPANY_INVITE",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
}

/**
 * Revokes an invite. Scoped by companyId so one tenant cannot cancel another's,
 * and a hard delete rather than `consumedAt` — the invite was never accepted,
 * so recording it as consumed would misreport what happened.
 */
export function revoke(companyId: string, tokenId: string) {
  return db.authToken.deleteMany({
    where: { id: tokenId, companyId, type: "COMPANY_INVITE", consumedAt: null },
  });
}
