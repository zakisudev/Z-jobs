/**
 * One closed error vocabulary, shared by every server action and route handler.
 *
 * The old app did `throw new Error(error)` in controllers, which stringified an
 * Error into "Error: ..." and leaked nodemailer stack traces to the browser.
 * Here, anything not explicitly modelled below becomes INTERNAL with a generic
 * message, and the real cause goes to the logger.
 */
export const ERROR_CODES = [
  "VALIDATION",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "QUOTA_EXCEEDED",
  "PAYMENT_REQUIRED",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type FieldErrors = Record<string, string[]>;

export type ActionError = {
  code: ErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
};

/** The single result shape every action returns. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(
  code: ErrorCode,
  message: string,
  fieldErrors?: FieldErrors,
): ActionResult<never> {
  return { ok: false, error: { code, message, ...(fieldErrors && { fieldErrors }) } };
}

/** Errors thrown inside handlers and translated by the action wrapper. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that.") {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class QuotaExceededError extends AppError {
  constructor(message = "You have used all of your available job posts.") {
    super("QUOTA_EXCEEDED", message);
    this.name = "QuotaExceededError";
  }
}

export class RateLimitedError extends AppError {
  constructor(
    message = "Too many attempts. Please wait and try again.",
    readonly retryAfterSeconds?: number,
  ) {
    super("RATE_LIMITED", message);
    this.name = "RateLimitedError";
  }
}

/**
 * Generic messages shown to users. Deliberately vague where a specific message
 * would leak information — `INVALID_CREDENTIALS` must not distinguish "no such
 * account" from "wrong password", or login becomes a user-enumeration oracle.
 */
export const MESSAGES = {
  INVALID_CREDENTIALS: "That email or password is incorrect.",
  ACCOUNT_LOCKED:
    "Too many failed sign-in attempts. Your account is locked for 15 minutes.",
  EMAIL_NOT_VERIFIED: "Please verify your email address to continue.",
  TOKEN_INVALID: "That link is invalid or has expired. Request a new one.",
  GENERIC_RESET:
    "If an account exists for that email, we've sent password reset instructions.",
  INTERNAL: "Something went wrong on our end. Please try again.",
} as const;
