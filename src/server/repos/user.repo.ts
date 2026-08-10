import type { Prisma, UserRole } from "@prisma/client";
import { db } from "@/server/db";

/**
 * User data access. `passwordHash` is never included in a default select — it
 * leaves this module only via `findAuthRecordByEmail`, which exists purely for
 * the login path.
 */

const PUBLIC_FIELDS = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  phone: true,
  emailVerifiedAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof PUBLIC_FIELDS }>;

export function findById(id: string) {
  return db.user.findFirst({
    where: { id, deletedAt: null },
    select: PUBLIC_FIELDS,
  });
}

export function findByEmail(email: string) {
  return db.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
    select: PUBLIC_FIELDS,
  });
}

/** Login path only — includes the hash and the lockout counters. */
export function findAuthRecordByEmail(email: string) {
  return db.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      firstName: true,
      lastName: true,
      emailVerifiedAt: true,
      failedLogins: true,
      lockedUntil: true,
    },
  });
}

export function create(input: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}) {
  return db.user.create({
    data: { ...input, email: input.email.toLowerCase() },
    select: PUBLIC_FIELDS,
  });
}

export function emailExists(email: string) {
  return db.user.findFirst({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
}

export function markVerified(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
    select: PUBLIC_FIELDS,
  });
}

export function recordSuccessfulLogin(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date(), failedLogins: 0, lockedUntil: null },
    select: { id: true },
  });
}

/** Locks the account for 15 minutes once the failure count reaches the cap. */
export async function recordFailedLogin(userId: string, maxAttempts: number) {
  const user = await db.user.update({
    where: { id: userId },
    data: { failedLogins: { increment: 1 } },
    select: { failedLogins: true },
  });

  if (user.failedLogins >= maxAttempts) {
    await db.user.update({
      where: { id: userId },
      data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000), failedLogins: 0 },
    });
    return { locked: true };
  }

  return { locked: false };
}

export function updatePassword(userId: string, passwordHash: string) {
  return db.user.update({
    where: { id: userId },
    data: { passwordHash, failedLogins: 0, lockedUntil: null },
    select: { id: true },
  });
}
