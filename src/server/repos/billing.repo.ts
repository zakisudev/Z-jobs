import type { TenantCtx } from "@/server/auth/context";
import { db } from "@/server/db";

/**
 * Billing reads. Every query takes the TenantCtx first and filters on
 * `ctx.companyId`, matching the convention that makes a cross-tenant read
 * structurally impossible rather than a matter of remembering the filter.
 */

/**
 * The credit ledger is append-only and authoritative — Wallet is a cache of it.
 * Showing the ledger rather than a single balance is what lets an employer see
 * WHY they have the credits they have, which is the only way to dispute a
 * charge.
 */
export function listLedger(ctx: TenantCtx, take = 50) {
  return db.creditLedger.findMany({
    where: { companyId: ctx.companyId },
    select: {
      id: true,
      kind: true,
      delta: true,
      balanceAfter: true,
      reason: true,
      createdAt: true,
      job: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function listOrders(ctx: TenantCtx, take = 20) {
  return db.order.findMany({
    where: { companyId: ctx.companyId },
    select: {
      id: true,
      amountMinor: true,
      currency: true,
      status: true,
      paidAt: true,
      createdAt: true,
      plan: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
