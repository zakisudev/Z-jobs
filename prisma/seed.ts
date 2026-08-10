import { PrismaClient, PlanKind } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { JOB_CATEGORIES } from "../src/lib/constants/categories";

const db = new PrismaClient();

/**
 * Idempotent seed — safe to re-run. Everything uses upsert keyed on a natural
 * unique column so re-seeding never duplicates rows.
 *
 * Prices are in MINOR UNITS (santim). 500 ETB = 50_000.
 * These figures are placeholders: validate against ~10 employer conversations
 * before treating them as real pricing.
 */

const PLANS = [
  {
    code: "free",
    name: "Free",
    kind: PlanKind.FREE,
    priceMinor: 0,
    jobPostCredits: 0,
    featuredCredits: 0,
    listingDays: 30,
    maxActiveJobs: 1, // the ceiling quota.ts enforces when the wallet is empty
    sortOrder: 0,
    perks: { support: "community", branding: false, verifiedBadge: false },
  },
  {
    code: "post_1",
    name: "Single Post",
    kind: PlanKind.ONE_OFF,
    priceMinor: 50_000, // 500 ETB
    jobPostCredits: 1,
    featuredCredits: 0,
    listingDays: 30,
    maxActiveJobs: null,
    sortOrder: 1,
    perks: { support: "email", branding: false, verifiedBadge: false },
  },
  {
    code: "bundle_5",
    name: "Bundle of 5",
    kind: PlanKind.BUNDLE,
    priceMinor: 200_000, // 2,000 ETB — 20% off five singles
    jobPostCredits: 5,
    featuredCredits: 0,
    listingDays: 30,
    maxActiveJobs: null,
    sortOrder: 2,
    perks: { support: "email", branding: false, verifiedBadge: false },
  },
  {
    code: "featured_1",
    name: "Featured Upgrade",
    kind: PlanKind.ONE_OFF,
    priceMinor: 30_000, // 300 ETB
    jobPostCredits: 0,
    featuredCredits: 1,
    listingDays: 14,
    maxActiveJobs: null,
    sortOrder: 3,
    perks: { placement: "top-of-list", days: 14 },
  },
  {
    code: "pro_90",
    name: "Employer Pro (90 days)",
    kind: PlanKind.TERM,
    priceMinor: 600_000, // 6,000 ETB
    jobPostCredits: 15,
    featuredCredits: 3,
    listingDays: 30,
    maxActiveJobs: null,
    sortOrder: 4,
    perks: {
      support: "priority",
      branding: true,
      verifiedBadge: true,
      companyPage: true,
      termDays: 90,
    },
  },
];

async function seedCategories() {
  for (const [i, c] of JOB_CATEGORIES.entries()) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameAm: c.nameAm, sortOrder: i },
      create: { slug: c.slug, name: c.name, nameAm: c.nameAm, sortOrder: i },
    });
  }
  console.log(`  categories: ${JOB_CATEGORIES.length}`);
}

async function seedPlans() {
  for (const p of PLANS) {
    await db.plan.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }
  console.log(`  plans: ${PLANS.length}`);
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@z-jobs.local";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SEED_ADMIN_PASSWORD is required in production. Refusing to create an admin with a known password.",
      );
    }
    console.log("  admin: skipped (set SEED_ADMIN_PASSWORD to create one)");
    return;
  }

  if (password.length < 10) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters.");
  }

  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: {
      email,
      passwordHash: await hash(password, {
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      }),
      role: "ADMIN",
      firstName: "Platform",
      lastName: "Admin",
      // Pre-verified: the admin has no inbox to receive a verification mail at.
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`  admin: ${email}`);
}

async function main() {
  console.log("Seeding…");
  await seedCategories();
  await seedPlans();
  await seedAdmin();
  console.log("Done.");
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());
