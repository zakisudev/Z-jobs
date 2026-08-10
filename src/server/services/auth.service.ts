import "server-only";
import { headers } from "next/headers";
import type { UserRole } from "@prisma/client";
import { hashPassword, verifyPassword, burnTimingBudget } from "@/server/auth/password";
import { generateToken, hashToken, TOKEN_TTL, expiresIn } from "@/server/auth/tokens";
import { createSession, destroyAllSessions } from "@/server/auth/session";
import * as users from "@/server/repos/user.repo";
import * as tokens from "@/server/repos/token.repo";
import * as audit from "@/server/repos/audit.repo";
import { sendMail } from "@/server/mail/mailer";
import {
  verifyEmailTemplate,
  passwordResetTemplate,
  passwordChangedTemplate,
  accountLockedTemplate,
} from "@/server/mail/templates";
import { AppError, MESSAGES } from "@/lib/errors";
import { logger } from "@/server/logger";

const MAX_LOGIN_ATTEMPTS = 10;

async function reqMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
  };
}

/** Issues a fresh verification token and emails it. */
export async function sendVerificationEmail(user: {
  id: string;
  email: string;
  firstName: string;
}) {
  const { raw, hash } = generateToken();

  await tokens.create({
    tokenHash: hash,
    type: "EMAIL_VERIFY",
    userId: user.id,
    expiresAt: expiresIn(TOKEN_TTL.EMAIL_VERIFY),
  });

  const message = verifyEmailTemplate(user.firstName, raw);
  await sendMail({ ...message, to: user.email });
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const existing = await users.emailExists(input.email);

  if (existing) {
    /**
     * Deliberately the same generic failure the UI shows for any registration
     * problem. The old app returned a distinct "User already exists", turning
     * /register into a user-enumeration oracle.
     */
    throw new AppError(
      "CONFLICT",
      "We couldn't create that account. If you already have one, try signing in.",
      { email: ["We couldn't use that email address."] },
    );
  }

  const user = await users.create({
    email: input.email,
    passwordHash: await hashPassword(input.password),
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
  });

  /**
   * Session first, email second. If the mail provider is down the account still
   * works and the user can request a resend — the old flow threw a 500 after
   * committing the row, so the account existed but the user believed signup
   * had failed.
   */
  await createSession(user.id);
  await sendVerificationEmail(user);

  const meta = await reqMeta();
  await audit.record({
    actorUserId: user.id,
    action: "user.registered",
    entityType: "User",
    entityId: user.id,
    ...meta,
    metadata: { role: input.role },
  });

  return user;
}

export async function login(input: { email: string; password: string }) {
  const record = await users.findAuthRecordByEmail(input.email);

  if (!record) {
    // Spend the same CPU time as a real verify so response timing does not
    // reveal whether the address is registered.
    await burnTimingBudget(input.password);
    throw new AppError("UNAUTHENTICATED", MESSAGES.INVALID_CREDENTIALS);
  }

  if (record.lockedUntil && record.lockedUntil > new Date()) {
    throw new AppError("RATE_LIMITED", MESSAGES.ACCOUNT_LOCKED);
  }

  const valid = await verifyPassword(record.passwordHash, input.password);

  if (!valid) {
    const { locked } = await users.recordFailedLogin(record.id, MAX_LOGIN_ATTEMPTS);

    if (locked) {
      const message = accountLockedTemplate(record.firstName);
      await sendMail({ ...message, to: record.email });
      throw new AppError("RATE_LIMITED", MESSAGES.ACCOUNT_LOCKED);
    }

    throw new AppError("UNAUTHENTICATED", MESSAGES.INVALID_CREDENTIALS);
  }

  await users.recordSuccessfulLogin(record.id);
  await createSession(record.id);

  const meta = await reqMeta();
  await audit.record({
    actorUserId: record.id,
    action: "user.login",
    entityType: "User",
    entityId: record.id,
    ...meta,
  });

  return {
    id: record.id,
    role: record.role,
    emailVerified: record.emailVerifiedAt !== null,
  };
}

/**
 * Consumes an email-verification token.
 *
 * The whole point of this function: the old equivalent was
 * `GET /verify?userId=3` with a sequential integer, so anyone could verify or
 * enumerate any account. Here the token is 256 bits, stored only as a hash,
 * single-use, and expiring.
 */
export async function verifyEmail(rawToken: string) {
  const token = await tokens.findUsable(hashToken(rawToken), "EMAIL_VERIFY");
  if (!token?.userId) throw new AppError("NOT_FOUND", MESSAGES.TOKEN_INVALID);

  const claimed = await tokens.consume(token.id, token.userId, "EMAIL_VERIFY");
  if (!claimed) throw new AppError("NOT_FOUND", MESSAGES.TOKEN_INVALID);

  const user = await users.markVerified(token.userId);

  await audit.record({
    actorUserId: user.id,
    action: "user.email_verified",
    entityType: "User",
    entityId: user.id,
    ...(await reqMeta()),
  });

  return user;
}

/**
 * Always resolves successfully, whether or not the address is registered.
 * Any branch that reveals existence turns this into an account-discovery tool.
 */
export async function requestPasswordReset(email: string) {
  const user = await users.findByEmail(email);
  if (!user) {
    logger.info({ email }, "password reset requested for unknown address");
    return;
  }

  const { raw, hash } = generateToken();
  await tokens.create({
    tokenHash: hash,
    type: "PASSWORD_RESET",
    userId: user.id,
    expiresAt: expiresIn(TOKEN_TTL.PASSWORD_RESET),
  });

  const message = passwordResetTemplate(user.firstName, raw);
  await sendMail({ ...message, to: user.email });

  await audit.record({
    actorUserId: user.id,
    action: "user.password_reset_requested",
    entityType: "User",
    entityId: user.id,
    ...(await reqMeta()),
  });
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const token = await tokens.findUsable(hashToken(rawToken), "PASSWORD_RESET");
  if (!token?.userId) throw new AppError("NOT_FOUND", MESSAGES.TOKEN_INVALID);

  const claimed = await tokens.consume(token.id, token.userId, "PASSWORD_RESET");
  if (!claimed) throw new AppError("NOT_FOUND", MESSAGES.TOKEN_INVALID);

  const user = await users.findById(token.userId);
  if (!user) throw new AppError("NOT_FOUND", MESSAGES.TOKEN_INVALID);

  await users.updatePassword(user.id, await hashPassword(newPassword));

  /**
   * Revoke every session. A reset is the response to a suspected compromise,
   * so whatever the attacker was holding must stop working — including the
   * session this request arrived on.
   */
  await destroyAllSessions(user.id);

  const message = passwordChangedTemplate(user.firstName);
  await sendMail({ ...message, to: user.email });

  await audit.record({
    actorUserId: user.id,
    action: "user.password_reset_completed",
    entityType: "User",
    entityId: user.id,
    ...(await reqMeta()),
  });
}
