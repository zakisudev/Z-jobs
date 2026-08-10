import "server-only";
import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import type { z } from "zod";
import type { CompanyRole } from "@prisma/client";
import {
  AppError,
  MESSAGES,
  fail,
  ok,
  type ActionResult,
  type FieldErrors,
} from "@/lib/errors";
import { requireUser, requireVerified, requireCompany, requireAdmin } from "./auth/guard";
import type { AuthCtx, TenantCtx } from "./auth/context";
import { limitFor, type LimitName } from "./ratelimit";
import { logger } from "./logger";

/**
 * The wrapper every Server Action goes through, so that validation, auth,
 * rate limiting, error shaping, and logging cannot be forgotten on any one
 * action. The old controllers repeated (and inconsistently omitted) all five.
 */

/**
 * Generic over the validated input so `slugFrom` receives the parsed object
 * with real types, rather than needing a cast at the call site.
 */
type AuthMode<TInput> =
  | "public"
  | "user"
  | "verified"
  | "admin"
  | { company: CompanyRole[]; slugFrom: (input: TInput) => string };

type CtxFor<M> = M extends "public"
  ? null
  : M extends { company: CompanyRole[] }
    ? TenantCtx
    : AuthCtx;

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown"
  );
}

export function action<
  TSchema extends z.ZodTypeAny,
  TOut,
  TAuth extends AuthMode<z.infer<TSchema>>,
>(config: {
  input: TSchema;
  auth: TAuth;
  /**
   * Identifier resolution matters: keying login on IP alone lets one attacker
   * behind a NAT lock out a whole office, and keying on email alone lets a
   * botnet spread attempts across addresses. Most limits key on both.
   */
  rateLimit?: {
    name: LimitName;
    by: (input: z.infer<TSchema>, ctx: CtxFor<TAuth>, ip: string) => string;
  };
  handler: (input: z.infer<TSchema>, ctx: CtxFor<TAuth>) => Promise<TOut>;
}) {
  return async function run(rawInput: unknown): Promise<ActionResult<TOut>> {
    try {
      // 1. Validate before anything else, so malformed input never reaches auth
      //    lookups or the rate limiter.
      const parsed = config.input.safeParse(rawInput);
      if (!parsed.success) {
        return fail(
          "VALIDATION",
          "Please correct the highlighted fields.",
          parsed.error.flatten().fieldErrors as FieldErrors,
        );
      }
      const input = parsed.data as z.infer<TSchema>;

      // 2. Authorise.
      //
      // Narrowing is done on a local of the concrete union type: TypeScript
      // cannot narrow the generic parameter TAuth through comparisons, so
      // `config.auth` stays unnarrowed no matter how many branches precede it.
      const authMode: AuthMode<z.infer<TSchema>> = config.auth;
      let resolved: AuthCtx | TenantCtx | null;

      if (authMode === "public") {
        resolved = null;
      } else if (authMode === "user") {
        resolved = await requireUser();
      } else if (authMode === "verified") {
        resolved = await requireVerified();
      } else if (authMode === "admin") {
        resolved = await requireAdmin();
      } else {
        resolved = await requireCompany(authMode.slugFrom(input), authMode.company);
      }

      const ctx = resolved as CtxFor<TAuth>;

      // 3. Rate limit, after auth so the key can include the user or company.
      if (config.rateLimit) {
        const ip = await clientIp();
        const key = config.rateLimit.by(input, ctx, ip);
        const result = await limitFor(config.rateLimit.name, key);

        if (!result.allowed) {
          return fail(
            "RATE_LIMITED",
            `Too many attempts. Try again in ${result.retryAfterSeconds} seconds.`,
          );
        }
      }

      return ok(await config.handler(input, ctx));
    } catch (err) {
      // redirect()/notFound() signal control flow via a thrown error; it must
      // propagate or navigation silently stops working.
      if (isRedirectError(err)) throw err;
      if (err instanceof Error && err.message === "NEXT_NOT_FOUND") throw err;

      if (err instanceof AppError) {
        return fail(err.code, err.message, err.fieldErrors);
      }

      /**
       * Anything unmodelled becomes a generic INTERNAL. The old controllers did
       * `throw new Error(error)`, which shipped nodemailer stack traces to the
       * browser.
       */
      logger.error(
        { err: err instanceof Error ? err.stack : String(err) },
        "unhandled action error",
      );
      return fail("INTERNAL", MESSAGES.INTERNAL);
    }
  };
}
