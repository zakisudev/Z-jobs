import { hash, verify } from "@node-rs/argon2";

/**
 * Ported from the old `backend/utils/password.js`, which used bcryptjs at cost
 * 10 (pure JS, roughly 5x slower than native, and a cost factor that has been
 * below the recommended floor for years).
 *
 * Parameters are the OWASP argon2id baseline.
 */
const OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * A precomputed hash used to burn the same CPU time when an account does not
 * exist. Without it, "no such user" returns measurably faster than "wrong
 * password" and the login endpoint becomes a user-enumeration oracle.
 */
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$Kq0IhVKZKGUeH0oXKgOEUvY6vFhBOxaFvxBMwqPvGDo";

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain, OPTIONS);
  } catch {
    // Malformed stored hash — treat as a failed login rather than a 500.
    return false;
  }
}

/**
 * Call on the "user not found" branch of login so the response time matches
 * the "user found, wrong password" branch.
 */
export async function burnTimingBudget(plain: string): Promise<void> {
  try {
    await verify(DUMMY_HASH, plain, OPTIONS);
  } catch {
    // Expected to fail; the point is the elapsed time, not the result.
  }
}
