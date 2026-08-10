import { db } from "@/server/db";

/**
 * Sessions are opaque and server-side. The primary key IS the SHA-256 of the
 * cookie token, so the raw token is never stored and a database dump cannot be
 * replayed as live sessions.
 */

export function create(input: {
  id: string; // sha256(token)
  userId: string;
  expiresAt: Date;
  ip?: string | undefined;
  userAgent?: string | undefined;
}) {
  return db.session.create({ data: input, select: { id: true } });
}

/**
 * Resolves a session to its user in one round trip. Returns null for expired
 * sessions and for users that were soft-deleted after the session was issued —
 * the old app's JWT stayed valid for 30 days regardless.
 */
export function findValidWithUser(id: string) {
  return db.session.findFirst({
    where: { id, expiresAt: { gt: new Date() }, user: { deletedAt: null } },
    select: {
      id: true,
      expiresAt: true,
      activeCompanyId: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          emailVerifiedAt: true,
        },
      },
    },
  });
}

export function extend(id: string, expiresAt: Date) {
  return db.session.update({ where: { id }, data: { expiresAt }, select: { id: true } });
}

export function setActiveCompany(id: string, companyId: string | null) {
  return db.session.update({
    where: { id },
    data: { activeCompanyId: companyId },
    select: { id: true },
  });
}

export function destroy(id: string) {
  return db.session.deleteMany({ where: { id } });
}

/**
 * Revokes every session for a user. Called on password reset and password
 * change: a reset must invalidate whatever the attacker was holding.
 */
export function destroyAllForUser(userId: string) {
  return db.session.deleteMany({ where: { userId } });
}

/** Housekeeping for the cron. */
export function deleteExpired() {
  return db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
