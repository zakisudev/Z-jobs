import { db } from "@/server/db";

/**
 * Fixed-window fallback used only when Redis is unavailable. Less precise than
 * the Redis sliding window, but a degraded limiter beats no limiter — the old
 * app had none at all, leaving /login open to unlimited credential stuffing.
 */
export async function hitFixedWindow(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const existing = await db.rateLimitBucket.findUnique({ where: { key } });

  if (!existing || existing.resetAt <= now) {
    const resetAt = new Date(now.getTime() + windowMs);
    await db.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
    });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  const updated = await db.rateLimitBucket.update({
    where: { key },
    data: { count: { increment: 1 } },
    select: { count: true, resetAt: true },
  });

  return {
    allowed: true,
    remaining: Math.max(0, limit - updated.count),
    resetAt: updated.resetAt,
  };
}

export function purgeExpiredBuckets() {
  return db.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date() } } });
}
