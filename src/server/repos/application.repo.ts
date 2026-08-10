import { Prisma, type ApplicationStatus } from "@prisma/client";
import { db } from "@/server/db";
import type { AuthCtx, TenantCtx } from "@/server/auth/context";

/**
 * Applications.
 *
 * Every employer-side query filters on `ctx.companyId` — the denormalized
 * column on Application exists precisely so that "list applicants for my
 * company" never has to join through Job and risk being written as a bare
 * `where: { jobId }`.
 */

const EMPLOYER_SELECT = {
  id: true,
  status: true,
  coverLetter: true,
  rating: true,
  viewedAt: true,
  createdAt: true,
  job: { select: { id: true, slug: true, title: true } },
  seeker: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  },
} satisfies Prisma.ApplicationSelect;

export type EmployerApplication = Prisma.ApplicationGetPayload<{
  select: typeof EMPLOYER_SELECT;
}>;

export function listForCompany(
  ctx: TenantCtx,
  filters?: { jobId?: string; status?: ApplicationStatus },
) {
  return db.application.findMany({
    where: {
      companyId: ctx.companyId,
      ...(filters?.jobId && { jobId: filters.jobId }),
      ...(filters?.status && { status: filters.status }),
    },
    select: EMPLOYER_SELECT,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export function findForCompany(ctx: TenantCtx, id: string) {
  return db.application.findFirst({
    where: { id, companyId: ctx.companyId },
    select: EMPLOYER_SELECT,
  });
}

export function countForCompany(ctx: TenantCtx) {
  return db.application.count({ where: { companyId: ctx.companyId } });
}

// ───────────────────────────── seeker side ─────────────────────────────

export function listForSeeker(ctx: AuthCtx) {
  return db.application.findMany({
    where: { seekerId: ctx.user.id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      statusChangedAt: true,
      job: {
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          company: { select: { slug: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function hasApplied(seekerId: string, jobId: string) {
  return db.application.findUnique({
    where: { jobId_seekerId: { jobId, seekerId } },
    select: { id: true, status: true },
  });
}

// ───────────────────────────── mutations ─────────────────────────────

/**
 * Creating an application and bumping the job's counter must be atomic,
 * otherwise a failure between them leaves `applicationCount` permanently wrong.
 * The unique constraint on (jobId, seekerId) is what actually prevents
 * duplicates — a prior `hasApplied` check races.
 */
export function createWithCount(input: {
  jobId: string;
  seekerId: string;
  companyId: string;
  coverLetter?: string | undefined;
}) {
  return db.$transaction(async (tx) => {
    const application = await tx.application.create({
      data: {
        jobId: input.jobId,
        seekerId: input.seekerId,
        companyId: input.companyId,
        coverLetter: input.coverLetter ?? null,
        status: "SUBMITTED",
      },
      select: { id: true },
    });

    await tx.applicationEvent.create({
      data: {
        applicationId: application.id,
        actorUserId: input.seekerId,
        toStatus: "SUBMITTED",
      },
    });

    await tx.job.update({
      where: { id: input.jobId },
      data: { applicationCount: { increment: 1 } },
    });

    return application;
  });
}

export function updateStatusForCompany(
  ctx: TenantCtx,
  id: string,
  from: ApplicationStatus,
  to: ApplicationStatus,
) {
  return db.$transaction(async (tx) => {
    const updated = await tx.application.updateMany({
      where: { id, companyId: ctx.companyId },
      data: { status: to, statusChangedAt: new Date() },
    });

    if (updated.count === 0) return { ok: false as const };

    await tx.applicationEvent.create({
      data: {
        applicationId: id,
        actorUserId: ctx.user.id,
        fromStatus: from,
        toStatus: to,
      },
    });

    return { ok: true as const };
  });
}

export function markViewed(ctx: TenantCtx, id: string) {
  return db.application.updateMany({
    where: { id, companyId: ctx.companyId, viewedAt: null },
    data: { viewedAt: new Date(), status: "VIEWED" },
  });
}
