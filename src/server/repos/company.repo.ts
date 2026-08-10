import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { slugify, slugSuffix } from "@/lib/slug";

/**
 * Company creation is a single transaction that also makes the creator an
 * OWNER and opens a wallet. Doing these separately would let a crash leave a
 * company nobody can administer, or a company that cannot publish because it
 * has no wallet row to decrement.
 */
export async function createWithOwner(input: {
  ownerUserId: string;
  name: string;
  tagline?: string | undefined;
  description?: string | undefined;
  website?: string | undefined;
  city?: string | undefined;
  region?: string | undefined;
  size?: string | undefined;
  industrySlug?: string | undefined;
}) {
  const industry = input.industrySlug
    ? await db.category.findUnique({
        where: { slug: input.industrySlug },
        select: { id: true },
      })
    : null;

  // Suffix rather than a uniqueness retry loop: two companies may legitimately
  // share a name, and the slug is permanent once indexed.
  const slug = `${slugify(input.name)}-${slugSuffix(4)}`;

  return db.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        slug,
        name: input.name,
        tagline: input.tagline ?? null,
        description: input.description ?? null,
        website: input.website ?? null,
        city: input.city ?? null,
        region: input.region ?? null,
        size: (input.size ?? null) as Prisma.CompanyUncheckedCreateInput["size"],
        industryId: industry?.id ?? null,
      },
      select: { id: true, slug: true, name: true },
    });

    await tx.companyMember.create({
      data: { companyId: company.id, userId: input.ownerUserId, role: "OWNER" },
    });

    await tx.wallet.create({ data: { companyId: company.id } });

    return company;
  });
}

export function findPublicBySlug(slug: string) {
  return db.company.findFirst({
    where: { slug, deletedAt: null },
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
      createdAt: true,
    },
  });
}

export function findById(companyId: string) {
  return db.company.findFirst({
    where: { id: companyId, deletedAt: null },
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
  });
}

/** Everything the employer profile form needs to round-trip an edit. */
export function findForEdit(companyId: string) {
  return db.company.findFirst({
    where: { id: companyId, deletedAt: null },
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
      tin: true,
      verification: true,
      verifiedAt: true,
      createdAt: true,
      industry: { select: { slug: true, name: true } },
    },
  });
}

/**
 * Updates the public profile.
 *
 * The slug is deliberately NOT recomputed from a changed name: it is already
 * indexed by search engines and printed in every share link, so renaming a
 * company must not silently 404 its own listings.
 */
export async function updateProfile(
  companyId: string,
  input: {
    name: string;
    tagline?: string | undefined;
    description?: string | undefined;
    website?: string | undefined;
    city?: string | undefined;
    region?: string | undefined;
    size?: string | undefined;
    industrySlug?: string | undefined;
  },
) {
  const industry = input.industrySlug
    ? await db.category.findUnique({
        where: { slug: input.industrySlug },
        select: { id: true },
      })
    : null;

  return db.company.update({
    where: { id: companyId },
    data: {
      name: input.name,
      tagline: input.tagline ?? null,
      description: input.description ?? null,
      website: input.website ?? null,
      city: input.city ?? null,
      region: input.region ?? null,
      size: (input.size ?? null) as Prisma.CompanyUncheckedUpdateInput["size"],
      industryId: industry?.id ?? null,
    },
    select: { id: true, slug: true, name: true },
  });
}

export function updateSettings(companyId: string, input: { tin?: string | undefined }) {
  return db.company.update({
    where: { id: companyId },
    data: { tin: input.tin ?? null },
    select: { id: true, slug: true },
  });
}

/**
 * Moves an unverified company into the review queue.
 *
 * `updateMany` with the state in the WHERE clause rather than a read-then-write:
 * two rapid clicks would otherwise both pass a `verification === "UNVERIFIED"`
 * check and enqueue the company twice. A count of 0 means someone got there
 * first, which is not an error worth showing.
 */
export async function requestVerification(companyId: string) {
  const result = await db.company.updateMany({
    where: { id: companyId, verification: { in: ["UNVERIFIED", "REJECTED"] } },
    data: { verification: "PENDING" },
  });
  return result.count === 1;
}

/**
 * Soft delete. The row stays so published jobs, applications, and the credit
 * ledger keep their foreign keys — `Order.company` is even `onDelete: Restrict`,
 * so a hard delete would fail outright for any company that has ever paid.
 */
export function softDelete(companyId: string) {
  return db.$transaction([
    db.job.updateMany({
      where: { companyId, status: "PUBLISHED" },
      data: { status: "CLOSED" },
    }),
    db.company.update({
      where: { id: companyId },
      data: { deletedAt: new Date() },
      select: { id: true },
    }),
  ]);
}

export function getWallet(companyId: string) {
  return db.wallet.findUnique({ where: { companyId } });
}

/** Companies with at least one live vacancy, for the public directory. */
export function listHiringCompanies(take = 60) {
  return db.company.findMany({
    where: {
      deletedAt: null,
      jobs: {
        some: {
          status: "PUBLISHED",
          deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      region: true,
      verification: true,
      _count: {
        select: {
          jobs: {
            where: {
              status: "PUBLISHED",
              deletedAt: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function listPublicSlugs(take = 1000) {
  return db.company.findMany({
    where: { deletedAt: null, jobs: { some: { status: "PUBLISHED", deletedAt: null } } },
    select: { slug: true, updatedAt: true },
    take,
  });
}
