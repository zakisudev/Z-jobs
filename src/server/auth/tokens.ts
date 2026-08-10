import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * One-shot secrets: email verification, password reset, company invites.
 *
 * This replaces the old `GET /api/users/verify?userId=3`, where the "token" was
 * a sequential integer. Anyone could verify — or enumerate — any account by
 * counting upward.
 *
 * The invariants here:
 *   1. The raw token is 256 bits of CSPRNG output and exists only in the email.
 *   2. Only its SHA-256 is persisted, so a leaked database dump yields nothing
 *      replayable.
 *   3. Every token expires, and consumption is single-use and transactional.
 */

/** Base32 (Crockford-ish, no padding) — URL-safe and free of ambiguous glyphs. */
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function base32(bytes: Buffer): string {
  let out = "";
  for (const byte of bytes) {
    // charAt returns string (never undefined), unlike [] under
    // noUncheckedIndexedAccess. 256 is divisible by the 32-char alphabet, so
    // the modulo introduces no bias.
    out += ALPHABET.charAt(byte % ALPHABET.length);
  }
  return out;
}

/** Generates a raw token for the email and the hash to store alongside it. */
export function generateToken(): { raw: string; hash: string } {
  const raw = base32(randomBytes(32)); // 32 bytes of entropy
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Constant-time comparison for any place a caller-supplied digest is compared
 * against a stored one (webhook signatures, unsubscribe tokens).
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export const TOKEN_TTL = {
  /** Long enough to survive a spam folder and a night's sleep. */
  EMAIL_VERIFY: 24 * 60 * 60 * 1000,
  /** Short: a reset link is the single most dangerous token in the system. */
  PASSWORD_RESET: 60 * 60 * 1000,
  EMAIL_CHANGE: 60 * 60 * 1000,
  /** Invites are sent to people who may not be at their desk. */
  COMPANY_INVITE: 7 * 24 * 60 * 60 * 1000,
} as const;

export function expiresIn(ms: number): Date {
  return new Date(Date.now() + ms);
}
