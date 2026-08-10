import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { db } from "@/server/db";
import { generateToken, expiresIn, TOKEN_TTL } from "@/server/auth/tokens";
import * as tokens from "./token.repo";
import { hashPassword } from "@/server/auth/password";

/**
 * Runs against the real MySQL from docker-compose. Mocking Prisma here would
 * defeat the purpose: the single-use guarantee depends on an actual
 * compare-and-swap UPDATE, which a mock cannot exercise.
 */

const TEST_EMAIL = "token-repo-test@z-jobs.local";
let userId: string;

async function ensureUser() {
  const user = await db.user.upsert({
    where: { email: TEST_EMAIL },
    update: {},
    create: {
      email: TEST_EMAIL,
      passwordHash: await hashPassword("test-password-1234"),
      firstName: "Token",
      lastName: "Test",
      role: "SEEKER",
    },
    select: { id: true },
  });
  return user.id;
}

beforeEach(async () => {
  userId = await ensureUser();
  await db.authToken.deleteMany({ where: { userId } });
});

afterAll(async () => {
  await db.user.deleteMany({ where: { email: TEST_EMAIL } });
  await db.$disconnect();
});

describe("AuthToken lifecycle", () => {
  it("finds a usable token by its hash, never by the raw value", async () => {
    const { raw, hash } = generateToken();
    await tokens.create({
      tokenHash: hash,
      type: "EMAIL_VERIFY",
      userId,
      expiresAt: expiresIn(TOKEN_TTL.EMAIL_VERIFY),
    });

    // The raw token is not a lookup key — only its hash is stored.
    await expect(tokens.findUsable(raw, "EMAIL_VERIFY")).resolves.toBeNull();
    await expect(tokens.findUsable(hash, "EMAIL_VERIFY")).resolves.not.toBeNull();
  });

  it("rejects a token of the wrong type", async () => {
    const { hash } = generateToken();
    await tokens.create({
      tokenHash: hash,
      type: "EMAIL_VERIFY",
      userId,
      expiresAt: expiresIn(TOKEN_TTL.EMAIL_VERIFY),
    });

    // A verification token must not be redeemable as a password reset.
    await expect(tokens.findUsable(hash, "PASSWORD_RESET")).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const { hash } = generateToken();
    await tokens.create({
      tokenHash: hash,
      type: "PASSWORD_RESET",
      userId,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(tokens.findUsable(hash, "PASSWORD_RESET")).resolves.toBeNull();
  });

  it("is single-use: a consumed token cannot be reused", async () => {
    const { hash } = generateToken();
    await tokens.create({
      tokenHash: hash,
      type: "EMAIL_VERIFY",
      userId,
      expiresAt: expiresIn(TOKEN_TTL.EMAIL_VERIFY),
    });

    const found = await tokens.findUsable(hash, "EMAIL_VERIFY");
    expect(found).not.toBeNull();

    await expect(tokens.consume(found!.id, userId, "EMAIL_VERIFY")).resolves.toBe(true);
    await expect(tokens.findUsable(hash, "EMAIL_VERIFY")).resolves.toBeNull();
  });

  it("survives a concurrent double-redeem: exactly one caller wins", async () => {
    // Two clicks on the same emailed link, or a mail scanner prefetching it.
    const { hash } = generateToken();
    await tokens.create({
      tokenHash: hash,
      type: "PASSWORD_RESET",
      userId,
      expiresAt: expiresIn(TOKEN_TTL.PASSWORD_RESET),
    });

    const found = await tokens.findUsable(hash, "PASSWORD_RESET");
    expect(found).not.toBeNull();

    const results = await Promise.all([
      tokens.consume(found!.id, userId, "PASSWORD_RESET"),
      tokens.consume(found!.id, userId, "PASSWORD_RESET"),
      tokens.consume(found!.id, userId, "PASSWORD_RESET"),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("invalidates the user's other tokens of the same type on consume", async () => {
    // Requesting three reset links then using the newest must kill the older
    // two, so an intercepted earlier email is worthless.
    const older = generateToken();
    const newer = generateToken();

    for (const t of [older, newer]) {
      await tokens.create({
        tokenHash: t.hash,
        type: "PASSWORD_RESET",
        userId,
        expiresAt: expiresIn(TOKEN_TTL.PASSWORD_RESET),
      });
    }

    const found = await tokens.findUsable(newer.hash, "PASSWORD_RESET");
    await tokens.consume(found!.id, userId, "PASSWORD_RESET");

    await expect(tokens.findUsable(older.hash, "PASSWORD_RESET")).resolves.toBeNull();
  });

  it("does not touch other users' tokens", async () => {
    const otherEmail = "token-repo-other@z-jobs.local";
    const other = await db.user.upsert({
      where: { email: otherEmail },
      update: {},
      create: {
        email: otherEmail,
        passwordHash: await hashPassword("test-password-1234"),
        firstName: "Other",
        lastName: "User",
        role: "SEEKER",
      },
      select: { id: true },
    });

    const mine = generateToken();
    const theirs = generateToken();

    await tokens.create({
      tokenHash: mine.hash,
      type: "PASSWORD_RESET",
      userId,
      expiresAt: expiresIn(TOKEN_TTL.PASSWORD_RESET),
    });
    await tokens.create({
      tokenHash: theirs.hash,
      type: "PASSWORD_RESET",
      userId: other.id,
      expiresAt: expiresIn(TOKEN_TTL.PASSWORD_RESET),
    });

    const found = await tokens.findUsable(mine.hash, "PASSWORD_RESET");
    await tokens.consume(found!.id, userId, "PASSWORD_RESET");

    await expect(
      tokens.findUsable(theirs.hash, "PASSWORD_RESET"),
    ).resolves.not.toBeNull();

    await db.user.deleteMany({ where: { email: otherEmail } });
  });
});
