import "server-only";
import pino from "pino";
import { env } from "@/lib/env";

/**
 * Structured JSON logging to stdout, which the Docker json-file driver rotates.
 *
 * `redact` is the important part: this is the last line of defence against a
 * password, session token, or resume key reaching the log aggregator. Add to it
 * whenever a new secret-bearing field is introduced.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      "password",
      "confirmPassword",
      "passwordHash",
      "token",
      "tokenHash",
      "*.password",
      "*.passwordHash",
      "*.token",
      "req.headers.cookie",
      "req.headers.authorization",
      "CHAPA_SECRET_KEY",
      "S3_SECRET_ACCESS_KEY",
      "SESSION_SECRET",
    ],
    censor: "[redacted]",
  },
  // No pino-pretty transport: it spawns a worker thread that Next's bundler
  // cannot resolve, which floods the dev server with MODULE_NOT_FOUND. Pipe
  // through `pino-pretty` on the command line instead if you want colour:
  //   pnpm dev | pnpm exec pino-pretty
});
