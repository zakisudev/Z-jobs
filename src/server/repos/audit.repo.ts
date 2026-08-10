import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export function record(entry: {
  actorUserId?: string | null;
  companyId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return db.auditLog.create({ data: entry, select: { id: true } });
}

export function listForCompany(companyId: string, take = 50, cursor?: string) {
  return db.auditLog.findMany({
    where: { companyId },
    take,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      actor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}
