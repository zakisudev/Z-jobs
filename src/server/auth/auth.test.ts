import { describe, it, expect } from "vitest";
import { generateToken, hashToken, safeEqual } from "./tokens";
import { hashPassword, verifyPassword, burnTimingBudget } from "./password";

/**
 * These cover the invariants that replaced the old app's two worst auth bugs.
 * If any of them regress, account takeover becomes possible again.
 */

describe("one-shot tokens", () => {
  it("never stores the raw token", () => {
    const { raw, hash } = generateToken();
    expect(hash).not.toBe(raw);
    expect(hash).toHaveLength(64); // sha256 hex
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces unguessable, non-sequential tokens", () => {
    // The old verification link was `?userId=3` — a sequential integer, so any
    // account could be verified or enumerated by counting upward.
    const tokens = new Set(Array.from({ length: 500 }, () => generateToken().raw));
    expect(tokens.size).toBe(500);

    const [first] = [...tokens];
    expect(first).toBeDefined();
    expect(first?.length).toBe(32);
    expect(Number.isInteger(Number(first))).toBe(false);
  });

  it("hashes deterministically so lookup by hash works", () => {
    const { raw, hash } = generateToken();
    expect(hashToken(raw)).toBe(hash);
  });

  it("does not collide across the alphabet", () => {
    const { raw } = generateToken();
    expect(hashToken(raw)).not.toBe(hashToken(`${raw}x`));
  });

  describe("safeEqual", () => {
    it("matches identical strings", () => {
      expect(safeEqual("abc123", "abc123")).toBe(true);
    });

    it("rejects different strings and differing lengths", () => {
      expect(safeEqual("abc123", "abc124")).toBe(false);
      expect(safeEqual("abc", "abcdef")).toBe(false);
    });
  });
});

describe("password hashing", () => {
  it("produces an argon2id hash, not bcrypt", async () => {
    // The old app used bcryptjs at cost 10.
    const hash = await hashPassword("correct-horse-battery");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(hash.startsWith("$2a$")).toBe(false);
  });

  it("salts: the same password hashes differently every time", async () => {
    const a = await hashPassword("correct-horse-battery");
    const b = await hashPassword("correct-horse-battery");
    expect(a).not.toBe(b);
  });

  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct-horse-battery");
    await expect(verifyPassword(hash, "correct-horse-battery")).resolves.toBe(true);
    await expect(verifyPassword(hash, "Correct-horse-battery")).resolves.toBe(false);
  });

  it("returns false rather than throwing on a malformed stored hash", async () => {
    // A corrupt row must be a failed login, not a 500.
    await expect(verifyPassword("not-a-hash", "whatever")).resolves.toBe(false);
  });

  it("burnTimingBudget costs comparable time to a real verify", async () => {
    // Without this, "no such account" returns measurably faster than "wrong
    // password" and login becomes a user-enumeration oracle.
    const hash = await hashPassword("correct-horse-battery");

    const t0 = performance.now();
    await verifyPassword(hash, "wrong-password");
    const real = performance.now() - t0;

    const t1 = performance.now();
    await burnTimingBudget("wrong-password");
    const dummy = performance.now() - t1;

    // Same order of magnitude is what matters; exact parity is unattainable.
    expect(dummy).toBeGreaterThan(real * 0.25);
    expect(dummy).toBeLessThan(real * 4);
  });
});
