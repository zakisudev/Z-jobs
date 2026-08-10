import { z } from "zod";

/**
 * The single place in the codebase allowed to read `process.env`
 * (enforced by a `no-restricted-properties` ESLint rule).
 *
 * Parsing happens at module import, so a missing or malformed variable throws
 * during boot rather than at the moment a customer hits checkout.
 */

const isServer = typeof window === "undefined";

/** Absolute origin with no trailing slash — every email link is built from it. */
const absoluteUrl = z
  .string()
  .url()
  .refine((u) => !u.endsWith("/"), { message: "must not have a trailing slash" });

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: absoluteUrl,
  DATABASE_URL: z.string().min(1),

  // 32 bytes of entropy minimum. Base64 of 32 bytes is 44 chars.
  SESSION_SECRET: z.string().min(32, "generate with: openssl rand -base64 48"),

  REDIS_URL: z.string().url().optional(),

  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().min(1).default("Z-Jobs <noreply@jobs.zakisu.tech>"),
  MAIL_REPLY_TO: z.string().email().optional(),

  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default("auto"),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_PUBLIC: z.string().min(1),
  S3_BUCKET_PRIVATE: z.string().min(1),

  CHAPA_SECRET_KEY: z.string().optional(),
  CHAPA_WEBHOOK_SECRET: z.string().optional(),
  BILLING_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_PUBLIC_ASSET_HOST: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

function parseServerEnv() {
  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${issues}\n\nSee .env.example for the full contract.`,
    );
  }

  const env = parsed.data;

  // Cross-field rules that a per-field schema cannot express.
  if (env.BILLING_ENABLED && (!env.CHAPA_SECRET_KEY || !env.CHAPA_WEBHOOK_SECRET)) {
    throw new Error(
      "BILLING_ENABLED=true requires CHAPA_SECRET_KEY and CHAPA_WEBHOOK_SECRET.",
    );
  }

  /**
   * `next build` runs with NODE_ENV=production but has no runtime secrets — CI
   * builds the image before it ever sees the production environment. Applying
   * the runtime hardening rules there would make the build require a live Redis
   * and a Resend key just to prerender static pages.
   *
   * So: schema validation always runs; the runtime-only invariants below are
   * skipped during the build phase and enforced when the server actually boots.
   */
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  if (env.NODE_ENV === "production" && !isBuildPhase) {
    if (!env.APP_URL.startsWith("https://")) {
      throw new Error("APP_URL must be https:// in production (cookies are Secure).");
    }
    if (!env.REDIS_URL) {
      throw new Error("REDIS_URL is required in production for rate limiting.");
    }
    if (!env.RESEND_API_KEY) {
      throw new Error(
        "RESEND_API_KEY is required in production — email verification gates the product.",
      );
    }
  }

  return env;
}

const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_PUBLIC_ASSET_HOST: process.env.NEXT_PUBLIC_PUBLIC_ASSET_HOST,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

/**
 * Server-only configuration. Reading a property from the browser throws, which
 * keeps secrets from being pulled into a client bundle by accident.
 */
type ServerEnv = ReturnType<typeof parseServerEnv>;
type FullEnv = ServerEnv & typeof clientEnv;

export const env: FullEnv = isServer
  ? { ...parseServerEnv(), ...clientEnv }
  : new Proxy({} as FullEnv, {
      get(_target, prop: string) {
        if (prop in clientEnv) return clientEnv[prop as keyof typeof clientEnv];
        throw new Error(
          `env.${prop} is server-only. Use a NEXT_PUBLIC_* variable to expose it.`,
        );
      },
    });

export type Env = typeof env;
