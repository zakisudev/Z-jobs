import "server-only";
import { cookies, headers } from "next/headers";
import { hashToken, generateToken } from "./tokens";
import * as sessions from "@/server/repos/session.repo";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "zj_session";

/** 14 days, down from the old app's non-revocable 30-day JWT. */
const TTL_MS = 14 * 24 * 60 * 60 * 1000;
/** Slide the expiry when a session is more than half-used. */
const RENEW_AFTER_MS = TTL_MS / 2;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  /**
   * "lax", deliberately not "strict".
   *
   * Under "strict" (what the old app used) a user clicking a job link shared in
   * a Telegram channel or Facebook group arrives logged out — fatal for a
   * product whose growth plan is social sharing. "lax" still blocks cross-site
   * POST; CSRF is covered by the Origin check in middleware.ts.
   */
  sameSite: "lax",
  path: "/",
} as const;

async function requestMeta() {
  const h = await headers();
  return {
    ip:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent")?.slice(0, 255) ?? undefined,
  };
}

export async function createSession(userId: string): Promise<void> {
  const { raw, hash } = generateToken();
  const meta = await requestMeta();

  await sessions.create({
    id: hash,
    userId,
    expiresAt: new Date(Date.now() + TTL_MS),
    ...meta,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, raw, { ...COOKIE_OPTIONS, maxAge: TTL_MS / 1000 });
}

export type ResolvedSession = NonNullable<
  Awaited<ReturnType<typeof sessions.findValidWithUser>>
>;

/**
 * Reads and validates the session cookie. Returns null when absent, expired, or
 * pointing at a deleted user.
 */
export async function readSession(): Promise<ResolvedSession | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const session = await sessions.findValidWithUser(hashToken(raw));
  if (!session) return null;

  // Sliding renewal, so an active user is not logged out mid-task.
  const remaining = session.expiresAt.getTime() - Date.now();
  if (remaining < RENEW_AFTER_MS) {
    const expiresAt = new Date(Date.now() + TTL_MS);
    await sessions.extend(session.id, expiresAt);
    jar.set(SESSION_COOKIE, raw, { ...COOKIE_OPTIONS, maxAge: TTL_MS / 1000 });
  }

  return session;
}

/**
 * Deletes the server-side row as well as the cookie. The old `logoutUser`
 * cleared the cookie without matching its original attributes and left the JWT
 * valid for another 30 days.
 */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;

  if (raw) await sessions.destroy(hashToken(raw));
  jar.set(SESSION_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

/** Used after a password reset or change: revoke everything, everywhere. */
export async function destroyAllSessions(userId: string): Promise<void> {
  await sessions.destroyAllForUser(userId);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}
