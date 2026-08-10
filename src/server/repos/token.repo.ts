import type { Prisma, TokenType } from "@prisma/client";
import { db } from "@/server/db";

/** One-shot secrets. Only hashes are ever stored or queried. */

export function create(input: {
  tokenHash: string;
  type: TokenType;
  userId?: string;
  email?: string;
  companyId?: string;
  payload?: Prisma.InputJsonValue;
  expiresAt: Date;
}) {
  return db.authToken.create({ data: input, select: { id: true } });
}

export function findUsable(tokenHash: string, type: TokenType) {
  return db.authToken.findFirst({
    where: { tokenHash, type, consumedAt: null, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      userId: true,
      email: true,
      companyId: true,
      payload: true,
      expiresAt: true,
    },
  });
}

/**
 * Consumes a token and invalidates the user's other tokens of the same type in
 * one transaction, so a second click on an older email cannot re-trigger the
 * flow. Returns false if the token was already consumed by a concurrent
 * request — the `consumedAt: null` guard makes this a compare-and-swap.
 */
export async function consume(id: string, userId: string | null, type: TokenType) {
  const [claimed] = await db.$transaction([
    db.authToken.updateMany({
      where: { id, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    ...(userId
      ? [
          db.authToken.deleteMany({
            where: { userId, type, consumedAt: null, id: { not: id } },
          }),
        ]
      : []),
  ]);

  return claimed.count === 1;
}

export function deleteAllForUser(userId: string, type: TokenType) {
  return db.authToken.deleteMany({ where: { userId, type } });
}

export function deleteExpired() {
  return db.authToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
