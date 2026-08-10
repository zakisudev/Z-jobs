import "server-only";
import Redis from "ioredis";
import { env } from "@/lib/env";
import { hitFixedWindow } from "@/server/repos/ratelimit.repo";
import { logger } from "@/server/logger";

/**
 * Sliding-window rate limiting.
 *
 * Hand-rolled on ioredis rather than @upstash/ratelimit, because that library
 * speaks Upstash's HTTP protocol and would mean running a serverless-redis-http
 * proxy alongside the self-hosted Redis in docker-compose. This is ~40 lines
 * and talks to the Redis we already run.
 */

const globalForRedis = globalThis as unknown as { redis: Redis | null | undefined };

function getRedis(): Redis | null {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;

  if (!env.REDIS_URL) {
    globalForRedis.redis = null;
    return null;
  }

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    // Fail fast: a slow limiter must never become the request's latency floor.
    connectTimeout: 1000,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on("error", (err) => {
    logger.warn({ err: err.message }, "redis error; rate limiting may degrade");
  });

  void client.connect().catch(() => {
    /* handled by the error listener; the DB fallback covers it */
  });

  globalForRedis.redis = client;
  return client;
}

/**
 * Sliding window via a sorted set: drop entries older than the window, count
 * what remains, add this hit. Executed in one pipeline so it is atomic enough
 * for this purpose (a race can admit one extra request under heavy contention,
 * which is an acceptable trade for not shipping a Lua script).
 */
async function hitRedis(
  redis: Redis,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = Date.now();
  const cutoff = now - windowMs;
  const member = `${now}-${Math.random().toString(36).slice(2, 10)}`;

  const results = await redis
    .multi()
    .zremrangebyscore(key, 0, cutoff)
    .zcard(key)
    .zadd(key, now, member)
    .pexpire(key, windowMs)
    .exec();

  // results[1] is the zcard reply: [error, value]
  const priorCount = Number(results?.[1]?.[1] ?? 0);

  if (priorCount >= limit) {
    // Over the limit: remove the hit we just added so a client hammering the
    // endpoint cannot keep pushing its own reset time forward.
    await redis.zrem(key, member);
    return { allowed: false, remaining: 0, resetAt: new Date(now + windowMs) };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - priorCount - 1),
    resetAt: new Date(now + windowMs),
  };
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
};

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const namespaced = `rl:${key}`;
  const redis = getRedis();

  let outcome: { allowed: boolean; remaining: number; resetAt: Date };

  if (redis && redis.status === "ready") {
    try {
      outcome = await hitRedis(redis, namespaced, limit, windowMs);
    } catch {
      outcome = await hitFixedWindow(namespaced, limit, windowMs);
    }
  } else {
    outcome = await hitFixedWindow(namespaced, limit, windowMs);
  }

  return {
    ...outcome,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((outcome.resetAt.getTime() - Date.now()) / 1000),
    ),
  };
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Central limit table. Login and register are the ones that matter most: the
 * old app allowed unlimited attempts against both.
 */
export const LIMITS = {
  login: { limit: 5, windowMs: 15 * MINUTE },
  register: { limit: 3, windowMs: HOUR },
  passwordResetRequest: { limit: 3, windowMs: HOUR },
  verificationResend: { limit: 3, windowMs: HOUR },
  applyToJob: { limit: 10, windowMs: HOUR },
  applyToJobDaily: { limit: 30, windowMs: DAY },
  publishJob: { limit: 20, windowMs: DAY },
  presignUpload: { limit: 20, windowMs: HOUR },
  publicSearch: { limit: 60, windowMs: MINUTE },
  checkoutInit: { limit: 10, windowMs: HOUR },
} as const;

export type LimitName = keyof typeof LIMITS;

export function limitFor(name: LimitName, identifier: string) {
  const { limit, windowMs } = LIMITS[name];
  return rateLimit(`${name}:${identifier}`, limit, windowMs);
}
