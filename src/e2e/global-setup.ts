import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({ path: ".env" });

/**
 * Clears rate-limit state before a run.
 *
 * Every test signs up, and registration is capped at 3/hour/IP — so a second
 * run inside the hour fails at the first step. The limits themselves are NOT
 * relaxed for tests: an E2E suite that passes against weakened limits proves
 * nothing about production. Only the accumulated counters are reset.
 */
export default async function globalSetup() {
  const url = process.env.REDIS_URL;

  if (url) {
    const redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
    try {
      await redis.connect();
      const keys = await redis.keys("rl:*");
      if (keys.length > 0) await redis.del(...keys);
      console.log(`[e2e] cleared ${keys.length} rate-limit keys`);
    } catch {
      // Redis absent: the DB fallback below covers it.
    } finally {
      redis.disconnect();
    }
  }

  const db = new PrismaClient();
  try {
    await db.rateLimitBucket.deleteMany({});
    // Companies first: Job.createdById is Restrict, so users cannot be deleted
    // while they still own jobs.
    await db.company.deleteMany({ where: { name: { contains: "Acme Tech " } } });
    // Leftover accounts from an interrupted run would collide on email.
    await db.user.deleteMany({
      where: {
        OR: [
          { email: { contains: "@z-jobs.local" } },
          { email: { contains: "@shell-e2e.local" } },
          { email: { contains: "@mvp-e2e.local" } },
        ],
      },
    });
  } finally {
    await db.$disconnect();
  }
}
