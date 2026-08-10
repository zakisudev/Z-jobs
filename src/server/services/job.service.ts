import "server-only";
import type { TenantCtx } from "@/server/auth/context";
import { findById as findCompanyById } from "@/server/repos/company.repo";
import { AppError, QuotaExceededError } from "@/lib/errors";
import { jobSlug } from "@/lib/slug";
import { toMinor } from "@/lib/money";
import * as jobs from "@/server/repos/job.repo";
import * as audit from "@/server/repos/audit.repo";
import type { JobInput } from "@/lib/schemas/job";

/**
 * Job lifecycle. Quota is enforced in exactly one place — `publish` — inside
 * the same transaction that flips the status, so the UI can never be the thing
 * that prevents an over-quota publish.
 */

/**
 * Free tier: one active listing. Paid plans lift this in Phase 4.
 *
 * Exported so the employer console states the same number this transaction
 * enforces. It was previously private and the dashboard hardcoded its own
 * copy, which is how a UI ends up promising a limit the server does not apply.
 */
export const FREE_TIER_ACTIVE_JOBS = 1;

function toJobData(input: JobInput, categoryId: string | null) {
  return {
    title: input.title,
    description: input.description,
    summary: input.summary ?? null,
    employmentType: input.employmentType,
    workplaceType: input.workplaceType,
    experienceLevel: input.experienceLevel,
    categoryId,
    city: input.city ?? null,
    region: input.region ?? null,
    // Denormalized so the public feed can filter on an index instead of
    // computing it per row.
    isRemote: input.workplaceType === "REMOTE",
    salaryMin: input.salaryMin === undefined ? null : toMinor(input.salaryMin),
    salaryMax: input.salaryMax === undefined ? null : toMinor(input.salaryMax),
    salaryPeriod: input.salaryPeriod,
    salaryIsPublic: input.salaryIsPublic,
    vacancies: input.vacancies,
    applicationEmail: input.applicationEmail ?? null,
  };
}

async function resolveCategoryId(slug: string): Promise<string | null> {
  const category = await jobs.findCategoryIdBySlug(slug);
  return category?.id ?? null;
}

export async function createDraft(ctx: TenantCtx, input: JobInput) {
  const company = await findCompanyById(ctx.companyId);
  if (!company) throw new AppError("NOT_FOUND", "Company not found.");

  const categoryId = await resolveCategoryId(input.categorySlug);

  const job = await jobs.create({
    ...toJobData(input, categoryId),
    companyId: ctx.companyId,
    createdById: ctx.user.id,
    slug: jobSlug(input.title, company.name),
    status: "DRAFT",
  });

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "job.created",
    entityType: "Job",
    entityId: job.id,
  });

  return job;
}

export async function update(ctx: TenantCtx, jobId: string, input: JobInput) {
  const existing = await jobs.findForCompany(ctx, jobId);
  if (!existing) throw new AppError("NOT_FOUND", "That job no longer exists.");

  const categoryId = await resolveCategoryId(input.categorySlug);
  await jobs.updateForCompany(ctx, jobId, toJobData(input, categoryId));

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "job.updated",
    entityType: "Job",
    entityId: jobId,
  });

  return { id: jobId, slug: existing.slug };
}

/**
 * Publishes a job and consumes quota in one transaction.
 *
 * The `SELECT ... FOR UPDATE` on the wallet is what makes two concurrent
 * publish requests with one credit resolve to exactly one success. Checking a
 * balance and then writing without the lock would let both read "1" and both
 * proceed.
 */
export async function publish(ctx: TenantCtx, jobId: string, expiresInDays: number) {
  const job = await jobs.findForCompany(ctx, jobId);
  if (!job) throw new AppError("NOT_FOUND", "That job no longer exists.");

  if (job.status === "PUBLISHED") {
    return { id: job.id, slug: job.slug, alreadyPublished: true };
  }

  const now = new Date();

  // PENDING_REVIEW exists in the schema for moderation; the MVP publishes
  // directly and the admin queue turns that on in a later phase.
  const result = await jobs.publishWithQuota({
    companyId: ctx.companyId,
    actorUserId: ctx.user.id,
    jobId,
    publishedAt: job.publishedAt ?? now,
    expiresAt: new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000),
    freeTierActiveLimit: FREE_TIER_ACTIVE_JOBS,
  });

  if (!result.ok) {
    throw new QuotaExceededError(
      `Your free plan allows ${FREE_TIER_ACTIVE_JOBS} active job. Close an existing listing to publish another.`,
    );
  }

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "job.published",
    entityType: "Job",
    entityId: jobId,
  });

  return { id: job.id, slug: job.slug, alreadyPublished: false };
}

export async function close(ctx: TenantCtx, jobId: string) {
  const job = await jobs.findForCompany(ctx, jobId);
  if (!job) throw new AppError("NOT_FOUND", "That job no longer exists.");

  await jobs.updateForCompany(ctx, jobId, {
    status: "CLOSED",
    closedAt: new Date(),
  });

  await audit.record({
    actorUserId: ctx.user.id,
    companyId: ctx.companyId,
    action: "job.closed",
    entityType: "Job",
    entityId: jobId,
  });

  return { id: jobId };
}
