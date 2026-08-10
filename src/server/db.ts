import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

/**
 * Ported from the old `backend/config/db.js`. The global singleton guard is
 * the part worth keeping: without it, Next's dev-mode module reloading opens a
 * new connection pool on every hot reload until MySQL refuses connections.
 *
 * The old `connectDB()` wrapper is deliberately gone — Prisma connects lazily,
 * and an eager `$connect()` at module scope breaks Next's build-time module
 * evaluation (pages are rendered without a database during `next build`).
 *
 * IMPORTANT: this module may only be imported from `src/server/repos/`.
 * See the `no-restricted-imports` rule in eslint.config.mjs for why.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
