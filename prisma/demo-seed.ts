import { PrismaClient, type WorkplaceType } from "@prisma/client";
import { hash } from "@node-rs/argon2";

/**
 * Demo data for local review: two employers with published vacancies, plus a
 * seeker account. Development only — it creates accounts with a known password.
 *
 *   pnpm db:demo      seed
 *   pnpm db:demo --clean   remove everything it created
 */

const db = new PrismaClient();
const DEMO_PASSWORD = "DemoPassword2026";
const DEMO_TAG = "demo.z-jobs.local";

/**
 * Applicants spread across the pipeline.
 *
 * Without these the employer console seeds empty, so the applicant list, the
 * stage counts, and every status transition were impossible to review locally
 * without hand-writing rows. Emails carry DEMO_TAG so `--clean` removes them
 * and the applications cascade with the user.
 */
const APPLICANTS = [
  { first: "Selam", last: "Bekele", phone: "+251911234567", status: "SUBMITTED" },
  { first: "Yonas", last: "Tesfaye", phone: "+251911234568", status: "SHORTLISTED" },
  { first: "Hanna", last: "Girma", phone: null, status: "INTERVIEW" },
  { first: "Kalkidan", last: "Alemu", phone: "+251911234570", status: "OFFER" },
  { first: "Nahom", last: "Desta", phone: null, status: "REJECTED" },
] as const;

const COMPANIES = [
  {
    slug: "abyssinia-tech-demo",
    name: "Abyssinia Tech",
    tagline: "Payments infrastructure for Ethiopian businesses",
    description:
      "We build the rails that let Ethiopian businesses accept digital payments. Our team of 40 works out of Bole, Addis Ababa.",
    city: "Addis Ababa",
    region: "addis-ababa",
    size: "SIZE_11_50" as const,
    owner: { email: `meron@${DEMO_TAG}`, firstName: "Meron", lastName: "Tadesse" },
    jobs: [
      {
        title: "Senior Backend Engineer",
        summary: "Own our payments API and the services behind it.",
        description: `We are looking for a senior backend engineer to own our payments API.

What you will do:
- Design and build services that move money reliably
- Own database schema design and query performance
- Work directly with the founding team on architecture

What we are looking for:
- 5+ years building production backend systems
- Strong SQL and relational modelling
- Experience with payment systems is a plus, not a requirement

We offer a competitive salary, private health cover, and a genuine say in technical direction.`,
        categorySlug: "information-technology",
        employmentType: "FULL_TIME" as const,
        experienceLevel: "SENIOR" as const,
        workplaceType: "HYBRID" as WorkplaceType,
        salaryMin: 45_000_00,
        salaryMax: 70_000_00,
      },
      {
        title: "Product Designer",
        summary: "Design merchant-facing tools used by thousands of businesses.",
        description: `We need a product designer to shape the tools our merchants use every day.

You will work across our dashboard, onboarding flow, and mobile experience. Most of our merchants are small businesses using mid-range Android phones on expensive data, so designing for constraint is the job.

Requirements:
- A portfolio showing shipped product work
- Comfort with design systems and component thinking
- Ability to prototype and test with real users`,
        categorySlug: "creative-design",
        employmentType: "FULL_TIME" as const,
        experienceLevel: "MID" as const,
        workplaceType: "ONSITE" as WorkplaceType,
        salaryMin: 30_000_00,
        salaryMax: 45_000_00,
      },
    ],
  },
  {
    slug: "green-valley-agro-demo",
    name: "Green Valley Agro",
    tagline: "Sustainable agriculture across the Rift Valley",
    description:
      "We work with over 3,000 smallholder farmers to improve yields and connect produce to export markets.",
    city: "Adama",
    region: "oromia",
    size: "SIZE_201_500" as const,
    owner: { email: `abebe@${DEMO_TAG}`, firstName: "Abebe", lastName: "Kebede" },
    jobs: [
      {
        title: "Agronomist — Field Operations",
        summary: "Support smallholder farmers with agronomic best practice.",
        description: `We are hiring an agronomist to work directly with farmers across the Rift Valley.

Responsibilities:
- Run field trials and document outcomes
- Train farmer groups on soil health and irrigation
- Report findings to the operations team

Requirements:
- Degree in Agriculture, Plant Science, or related field
- Willingness to travel across Oromia
- Amharic and Afaan Oromo both strongly preferred`,
        categorySlug: "agriculture",
        employmentType: "FULL_TIME" as const,
        experienceLevel: "MID" as const,
        workplaceType: "ONSITE" as WorkplaceType,
        salaryMin: 22_000_00,
        salaryMax: 32_000_00,
      },
      {
        title: "Logistics Coordinator",
        summary: "Coordinate produce movement from farm to export hub.",
        description: `Coordinate the movement of produce from collection points to our packing facility and on to export.

You will manage transport scheduling, track cold chain compliance, and resolve delays before they become spoilage. This role suits someone organised, calm under pressure, and comfortable on the phone.

Requirements:
- 3+ years in logistics or supply chain
- Strong spreadsheet skills
- Experience with perishable goods is an advantage`,
        categorySlug: "logistics-supply-chain",
        employmentType: "FULL_TIME" as const,
        experienceLevel: "MID" as const,
        workplaceType: "ONSITE" as WorkplaceType,
        salaryMin: 18_000_00,
        salaryMax: 26_000_00,
      },
    ],
  },
];

/** Applications for the first demo company, one per pipeline stage. */
async function seedApplicants(passwordHash: string) {
  const first = COMPANIES[0];
  if (!first) return;

  const company = await db.company.findUnique({
    where: { slug: first.slug },
    select: { id: true, name: true },
  });
  if (!company) return;

  const jobs = await db.job.findMany({
    where: { companyId: company.id },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });
  if (jobs.length === 0) return;

  for (const [i, person] of APPLICANTS.entries()) {
    const seeker = await db.user.create({
      data: {
        email: `${person.first.toLowerCase()}@${DEMO_TAG}`,
        passwordHash,
        firstName: person.first,
        lastName: person.last,
        phone: person.phone,
        role: "SEEKER",
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    });

    const job = jobs[i % jobs.length];
    if (!job) continue;

    await db.application.create({
      data: {
        jobId: job.id,
        seekerId: seeker.id,
        companyId: company.id,
        status: person.status,
        coverLetter:
          i % 2 === 0
            ? `I have spent the last four years doing ${job.title.toLowerCase()} work for Addis-based teams, and I would like to bring that to ${company.name}.\n\nHappy to walk through specifics whenever suits.`
            : null,
        // Staggered so the list has a believable recency order.
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        statusChangedAt: person.status === "SUBMITTED" ? null : new Date(),
      },
    });
  }

  /*
   * Job.applicationCount is denormalized and normally incremented in the same
   * transaction as the insert. Seeding rows directly bypasses that, so it has
   * to be recomputed or the console shows a total that disagrees with its own
   * per-job rows.
   */
  for (const job of jobs) {
    const applicationCount = await db.application.count({ where: { jobId: job.id } });
    await db.job.update({
      where: { id: job.id },
      data: { applicationCount, viewCount: 120 + applicationCount * 31 },
    });
  }
}

async function clean() {
  await db.company.deleteMany({ where: { slug: { in: COMPANIES.map((c) => c.slug) } } });
  await db.user.deleteMany({ where: { email: { contains: DEMO_TAG } } });
  console.log("Demo data removed.");
}

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo accounts in production.");
  }

  await clean();

  const passwordHash = await hash(DEMO_PASSWORD, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  for (const spec of COMPANIES) {
    const owner = await db.user.create({
      data: {
        email: spec.owner.email,
        passwordHash,
        firstName: spec.owner.firstName,
        lastName: spec.owner.lastName,
        role: "EMPLOYER",
        emailVerifiedAt: new Date(),
      },
      select: { id: true },
    });

    const company = await db.company.create({
      data: {
        slug: spec.slug,
        name: spec.name,
        tagline: spec.tagline,
        description: spec.description,
        city: spec.city,
        region: spec.region,
        size: spec.size,
        verification: "VERIFIED",
        verifiedAt: new Date(),
        members: { create: { userId: owner.id, role: "OWNER" } },
        wallet: { create: { jobPostBalance: 10 } },
      },
      select: { id: true },
    });

    for (const job of spec.jobs) {
      const category = await db.category.findUnique({
        where: { slug: job.categorySlug },
        select: { id: true },
      });

      await db.job.create({
        data: {
          companyId: company.id,
          createdById: owner.id,
          categoryId: category?.id ?? null,
          slug: `${job.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-at-${spec.slug}`,
          title: job.title,
          summary: job.summary,
          description: job.description,
          employmentType: job.employmentType,
          experienceLevel: job.experienceLevel,
          workplaceType: job.workplaceType,
          // Mirrors workplaceType — the public feed filters on this denormalized
          // column so it can use an index.
          isRemote: job.workplaceType === "REMOTE",
          city: spec.city,
          region: spec.region,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryPeriod: "MONTHLY",
          status: "PUBLISHED",
          publishedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  const seeker = await db.user.create({
    data: {
      email: `dawit@${DEMO_TAG}`,
      passwordHash,
      firstName: "Dawit",
      lastName: "Girma",
      role: "SEEKER",
      emailVerifiedAt: new Date(),
    },
    select: { email: true },
  });

  await seedApplicants(passwordHash);

  console.log(
    `Seeded ${COMPANIES.length} companies, 4 published jobs, and ${APPLICANTS.length} applicants.`,
  );
  console.log(`\nDemo accounts (password: ${DEMO_PASSWORD})`);
  for (const c of COMPANIES) console.log(`  employer  ${c.owner.email}`);
  console.log(`  seeker    ${seeker.email}`);
}

const run = process.argv.includes("--clean") ? clean : seed;

run()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());
