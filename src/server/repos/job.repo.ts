import { Prisma, type JobStatus } from "@prisma/client";
import { db } from "@/server/db";
import type { TenantCtx } from "@/server/auth/context";

/**
 * Job data access.
 *
 * Employer-facing reads take a TenantCtx first and splice `companyId` into the
 * `where`. Public reads are a separate, explicitly-named set that only ever
 * match PUBLISHED, non-deleted, unexpired rows — so there is no single function
 * that could accidentally serve a draft to the public.
 */

const CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  employmentType: true,
  workplaceType: true,
  experienceLevel: true,
  city: true,
  region: true,
  isRemote: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  salaryPeriod: true,
  salaryIsPublic: true,
  isFeatured: true,
  publishedAt: true,
  expiresAt: true,
  applicationCount: true,
  company: {
    select: { id: true, slug: true, name: true, verification: true },
  },
  category: { select: { slug: true, name: true } },
} satisfies Prisma.JobSelect;

export type JobCard = Prisma.JobGetPayload<{ select: typeof CARD_SELECT }>;

/** The predicate that defines "publicly visible". Used by every public read. */
function publicWhere(): Prisma.JobWhereInput {
  return {
    status: "PUBLISHED",
    deletedAt: null,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

// ───────────────────────────── public reads ─────────────────────────────

export type PublicSearchArgs = {
  q?: string | undefined;
  categorySlug?: string | undefined;
  region?: string | undefined;
  employmentType?: string | undefined;
  experienceLevel?: string | undefined;
  remoteOnly?: boolean | undefined;
  skip: number;
  take: number;
};

function filterWhere(args: PublicSearchArgs): Prisma.JobWhereInput {
  return {
    ...publicWhere(),
    ...(args.categorySlug && { category: { slug: args.categorySlug } }),
    ...(args.region && { region: args.region }),
    ...(args.employmentType && {
      employmentType: args.employmentType as Prisma.JobWhereInput["employmentType"],
    }),
    ...(args.experienceLevel && {
      experienceLevel: args.experienceLevel as Prisma.JobWhereInput["experienceLevel"],
    }),
    ...(args.remoteOnly && { isRemote: true }),
  };
}

/**
 * Strips every FULLTEXT boolean operator from user input, then re-adds `+term*`
 * per token. User text is never interpolated as operators — a stray `(` or `~`
 * would otherwise change the query's meaning or make MySQL reject it.
 */
function toBooleanQuery(raw: string): string {
  const tokens = raw
    .replace(/[+\-><()~*"@]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 8);

  return tokens.map((t) => `+${t}*`).join(" ");
}

export async function searchPublicJobs(
  args: PublicSearchArgs,
): Promise<{ jobs: JobCard[]; total: number }> {
  const where = filterWhere(args);

  // No keyword: a plain indexed query covers it via
  // @@index([status, publishedAt DESC]). Skip the raw SQL entirely.
  if (!args.q?.trim()) {
    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where,
        select: CARD_SELECT,
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
        skip: args.skip,
        take: args.take,
      }),
      db.job.count({ where }),
    ]);
    return { jobs, total };
  }

  const boolQuery = toBooleanQuery(args.q);
  if (!boolQuery) return { jobs: [], total: 0 };

  /**
   * MATCH ... AGAINST rather than LIKE '%term%': LIKE cannot use an index and
   * degrades linearly into a full scan of a TEXT column. Raw SQL rather than
   * Prisma's fullTextSearch preview because the relevance score is needed for
   * ordering and that API has been unstable across MySQL majors.
   */
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT j.id
    FROM Job j
    WHERE j.status = 'PUBLISHED'
      AND j.deletedAt IS NULL
      AND (j.expiresAt IS NULL OR j.expiresAt > NOW())
      AND MATCH(j.title, j.description) AGAINST (${boolQuery} IN BOOLEAN MODE)
    ORDER BY
      (j.isFeatured AND (j.featuredUntil IS NULL OR j.featuredUntil > NOW())) DESC,
      MATCH(j.title, j.description) AGAINST (${boolQuery} IN BOOLEAN MODE) DESC,
      j.publishedAt DESC
    LIMIT 500`;

  const matchedIds = rows.map((r) => r.id);
  if (matchedIds.length === 0) return { jobs: [], total: 0 };

  // Re-apply the structured filters against the matched set, then paginate.
  const filtered = await db.job.findMany({
    where: { ...where, id: { in: matchedIds } },
    select: CARD_SELECT,
  });

  // Preserve relevance order from the raw query.
  const rank = new Map(matchedIds.map((id, i) => [id, i]));
  filtered.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));

  return {
    jobs: filtered.slice(args.skip, args.skip + args.take),
    total: filtered.length,
  };
}

export function findPublicBySlug(slug: string) {
  return db.job.findFirst({
    where: { slug, ...publicWhere() },
    select: {
      ...CARD_SELECT,
      description: true,
      vacancies: true,
      applicationEmail: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          description: true,
          website: true,
          city: true,
          region: true,
          size: true,
          verification: true,
        },
      },
    },
  });
}

/** Slugs for generateStaticParams and the sitemap. */
export function listPublicSlugs(take = 5000) {
  return db.job.findMany({
    where: publicWhere(),
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export function listPublicForCompany(companyId: string) {
  return db.job.findMany({
    where: { ...publicWhere(), companyId },
    select: CARD_SELECT,
    orderBy: { publishedAt: "desc" },
  });
}

export function listSimilar(jobId: string, categoryId: string | null, take = 4) {
  return db.job.findMany({
    where: { ...publicWhere(), id: { not: jobId }, ...(categoryId && { categoryId }) },
    select: CARD_SELECT,
    orderBy: { publishedAt: "desc" },
    take,
  });
}

/**
 * Apply path. Deliberately uses the same public predicate as the listing pages,
 * so posting a draft/closed/expired job's id straight to the apply action
 * cannot create an application.
 */
export function findPublicByIdForApply(id: string) {
  return db.job.findFirst({
    where: { id, ...publicWhere() },
    select: {
      id: true,
      title: true,
      companyId: true,
      company: { select: { name: true } },
    },
  });
}

export function incrementViewCount(id: string) {
  return db.job.updateMany({ where: { id }, data: { viewCount: { increment: 1 } } });
}

// ──────────────────────────── employer reads ────────────────────────────

export function listForCompany(ctx: TenantCtx, status?: JobStatus) {
  return db.job.findMany({
    where: { companyId: ctx.companyId, deletedAt: null, ...(status && { status }) },
    select: { ...CARD_SELECT, status: true, viewCount: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Ownership is in the `where`, not checked afterwards. The old app's
 * `getJob` used findUnique({ where: { id } }) with no scope, so any
 * authenticated user could read any other user's job by guessing an id.
 */
export function findForCompany(ctx: TenantCtx, id: string) {
  return db.job.findFirst({
    where: { id, companyId: ctx.companyId, deletedAt: null },
  });
}

export function countActive(companyId: string) {
  return db.job.count({
    where: { companyId, status: "PUBLISHED", deletedAt: null },
  });
}

// ───────────────────────────── mutations ─────────────────────────────

export function create(data: Prisma.JobUncheckedCreateInput) {
  return db.job.create({ data, select: { id: true, slug: true } });
}

export function updateForCompany(
  ctx: TenantCtx,
  id: string,
  data: Prisma.JobUncheckedUpdateInput,
) {
  return db.job.updateMany({ where: { id, companyId: ctx.companyId }, data });
}

export function softDeleteForCompany(ctx: TenantCtx, id: string) {
  return db.job.updateMany({
    where: { id, companyId: ctx.companyId },
    data: { deletedAt: new Date(), status: "CLOSED", closedAt: new Date() },
  });
}

export function findCategoryIdBySlug(slug: string) {
  return db.category.findUnique({ where: { slug }, select: { id: true } });
}

/**
 * Publishes a job and consumes quota in a single transaction.
 *
 * Lives in the repo because the `SELECT ... FOR UPDATE` is what makes two
 * concurrent publishes with one credit resolve to exactly one success — read
 * balance then write without the lock and both callers see the same value and
 * both proceed. The policy (how many free jobs) stays in the service; only the
 * mechanics are here.
 */
export async function publishWithQuota(args: {
  companyId: string;
  actorUserId: string;
  jobId: string;
  publishedAt: Date;
  expiresAt: Date;
  freeTierActiveLimit: number;
}): Promise<{ ok: true } | { ok: false; reason: "quota" }> {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ jobPostBalance: number }[]>`
      SELECT jobPostBalance FROM Wallet WHERE companyId = ${args.companyId} FOR UPDATE`;

    const balance = rows[0]?.jobPostBalance ?? 0;

    if (balance > 0) {
      const nextBalance = balance - 1;
      await tx.wallet.update({
        where: { companyId: args.companyId },
        data: { jobPostBalance: nextBalance },
      });
      await tx.creditLedger.create({
        data: {
          companyId: args.companyId,
          kind: "JOB_POST",
          delta: -1,
          balanceAfter: nextBalance,
          reason: "job.published",
          jobId: args.jobId,
          actorUserId: args.actorUserId,
        },
      });
    } else {
      const active = await tx.job.count({
        where: { companyId: args.companyId, status: "PUBLISHED", deletedAt: null },
      });
      if (active >= args.freeTierActiveLimit) {
        return { ok: false as const, reason: "quota" as const };
      }
    }

    await tx.job.update({
      where: { id: args.jobId },
      data: {
        status: "PUBLISHED",
        publishedAt: args.publishedAt,
        expiresAt: args.expiresAt,
      },
    });

    return { ok: true as const };
  });
}

/** Expiry cron: flips lapsed listings so JSON-LD `validThrough` stays truthful. */
export function expireLapsed() {
  return db.job.updateMany({
    where: { status: "PUBLISHED", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}
