import { test, expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

/**
 * The whole product loop, end to end:
 *   employer posts a job -> it appears publicly -> a seeker applies ->
 *   the employer sees the applicant and moves them through the pipeline.
 *
 * If this passes, the MVP works. If it fails, the product is broken regardless
 * of what any unit test says.
 *
 * Accounts are created directly in the database rather than through /register:
 * registration is capped at 3/hour/IP and this spec needs two users. The cap is
 * deliberately NOT relaxed for tests — sign-in still goes through the real UI.
 */

const db = new PrismaClient();
const PASSWORD = "correct-horse-battery-42";
const RUN = Date.now();

const EMPLOYER_EMAIL = `mvp-employer-${RUN}@mvp-e2e.local`;
const SEEKER_EMAIL = `mvp-seeker-${RUN}@mvp-e2e.local`;
const JOB_TITLE = `Senior Backend Engineer ${RUN}`;

test.describe.configure({ mode: "serial" });

// Starts signed out: the chromium project ships the shared session from
// auth.setup.ts, which would redirect /login straight to /dashboard.
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeAll(async () => {
  const passwordHash = await hash(PASSWORD, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  for (const [email, firstName, role] of [
    [EMPLOYER_EMAIL, "Meron", "EMPLOYER"],
    [SEEKER_EMAIL, "Dawit", "SEEKER"],
  ] as const) {
    await db.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName: "Test",
        role,
        // Pre-verified: publishing and applying both require a confirmed email,
        // and that flow is already covered in auth.spec.ts.
        emailVerifiedAt: new Date(),
      },
    });
  }
});

test.afterAll(async () => {
  // Order matters: Job.createdById is onDelete: Restrict (deliberately — a job
  // must not lose its author), so companies go first and cascade their jobs and
  // applications away before the users can be removed.
  await db.company.deleteMany({ where: { name: { contains: String(RUN) } } });
  await db.user.deleteMany({ where: { email: { contains: "@mvp-e2e.local" } } });
  await db.$disconnect();
});

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("employer creates a company and publishes a job", async ({ page }) => {
  await signIn(page, EMPLOYER_EMAIL);

  await page.goto("/employer/onboarding");
  await page.getByLabel("Company name").fill(`Acme Tech ${RUN}`);
  await page.getByLabel("Tagline").fill("We build things");
  await page.getByLabel("Region").selectOption("addis-ababa");
  await page.getByRole("button", { name: /create company/i }).click();

  await expect(page).toHaveURL(/\/employer\/.+\/jobs/);

  await page
    .getByRole("link", { name: /post a job/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/jobs\/new/);

  await page.getByLabel("Job title").fill(JOB_TITLE);
  await page.getByLabel("Short summary").fill("Own our API and data layer.");
  await page
    .getByLabel("Job description")
    .fill(
      "We are looking for a senior backend engineer to own our API, database schema, and deployment pipeline. You will work closely with the founding team and have a real say in architecture decisions.",
    );
  await page.getByLabel("Category").selectOption("information-technology");
  await page.getByLabel("Region").selectOption("addis-ababa");
  await page.getByLabel("Minimum").fill("40000");
  await page.getByLabel("Maximum").fill("60000");

  await page.getByRole("button", { name: /^publish job$/i }).click();

  // Redirects back to the jobs list with the live-listing confirmation.
  await expect(page.getByText(/your job is live/i)).toBeVisible();
});

test("the job is publicly visible, searchable, and carries JobPosting JSON-LD", async ({
  page,
}) => {
  await page.goto("/jobs");
  await expect(page.getByRole("heading", { name: JOB_TITLE })).toBeVisible();

  // FULLTEXT search must find it by keyword.
  await page.goto("/jobs?q=backend");
  await expect(page.getByRole("heading", { name: JOB_TITLE })).toBeVisible();

  await page.getByRole("link", { name: JOB_TITLE }).click();
  await expect(page).toHaveURL(/\/jobs\/senior-backend-engineer/);

  // Structured data is what puts the listing into Google Jobs.
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(ld).toBeTruthy();
  const parsed = JSON.parse(ld!) as Record<string, unknown>;
  expect(parsed["@type"]).toBe("JobPosting");
  expect(parsed.title).toBe(JOB_TITLE);
  expect(parsed.hiringOrganization).toBeTruthy();
  // Google drops listings whose validThrough is in the past.
  expect(new Date(String(parsed.validThrough)).getTime()).toBeGreaterThan(Date.now());
});

test("a seeker applies, and cannot apply twice", async ({ page }) => {
  await signIn(page, SEEKER_EMAIL);

  await page.goto("/jobs?q=backend");
  await page.getByRole("link", { name: JOB_TITLE }).click();

  await page
    .getByLabel("Message to the employer")
    .fill("I have 6 years of Node experience.");
  await page.getByRole("button", { name: /submit application/i }).click();

  // Scoped to the panel: the toast also says "Application sent", so an
  // unscoped match hits two elements.
  await expect(page.getByText(/you applied to/i)).toBeVisible();

  // Reloading must show the applied state, not a fresh form.
  await page.reload();
  await expect(page.getByRole("button", { name: /submit application/i })).toBeHidden();

  await page.goto("/dashboard/applications");
  await expect(page.getByText(JOB_TITLE)).toBeVisible();
});

test("the employer sees the applicant and can move them through the pipeline", async ({
  page,
}) => {
  await signIn(page, EMPLOYER_EMAIL);

  const company = await db.company.findFirstOrThrow({
    where: { name: `Acme Tech ${RUN}` },
    select: { slug: true },
  });

  await page.goto(`/employer/${company.slug}/applicants`);
  await expect(page.getByText("Dawit Test")).toBeVisible();
  await expect(page.getByText(/i have 6 years of node/i)).toBeHidden(); // collapsed by default

  /*
   * Scoped to the applicant's own row, and exact.
   *
   * A bare `getByText("interview")` matches three things on this page now: the
   * status badge, the "Move to interview" button still on screen mid-request,
   * and the "Interview" column in the pipeline summary. Narrowing to the row
   * plus an exact match pins the assertion to the badge, which is the thing
   * this test is actually about.
   */
  const row = page.getByRole("listitem").filter({ hasText: "Dawit Test" });

  await page.getByRole("button", { name: /shortlist/i }).click();
  await expect(row.getByText("Shortlisted", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /move to interview/i }).click();
  await expect(row.getByText("Interview", { exact: true })).toBeVisible();
});

test("another company cannot see this company's applicants", async ({ page }) => {
  // The assertion the entire multi-tenancy design rests on.
  await signIn(page, SEEKER_EMAIL);

  const company = await db.company.findFirstOrThrow({
    where: { name: `Acme Tech ${RUN}` },
    select: { slug: true },
  });

  const response = await page.goto(`/employer/${company.slug}/applicants`);
  // 404, not 403: a 403 would confirm the company exists.
  expect(response?.status()).toBe(404);
});

test("the free tier blocks a second active job", async ({ page }) => {
  await signIn(page, EMPLOYER_EMAIL);

  const company = await db.company.findFirstOrThrow({
    where: { name: `Acme Tech ${RUN}` },
    select: { slug: true },
  });

  await page.goto(`/employer/${company.slug}/jobs/new`);
  await page.getByLabel("Job title").fill(`Second Role ${RUN}`);
  await page
    .getByLabel("Job description")
    .fill(
      "This is a second listing intended to exceed the free tier allowance of one active job at a time.",
    );
  await page.getByLabel("Category").selectOption("information-technology");
  await page.getByLabel("Region").selectOption("addis-ababa");
  await page.getByRole("button", { name: /^publish job$/i }).click();

  // Quota is enforced server-side inside the publish transaction.
  // Filtered because Next renders an always-present empty route announcer with
  // role="alert", which an unscoped getByRole would match first.
  await expect(
    page.getByRole("alert").filter({ hasText: /free plan allows/i }),
  ).toBeVisible();
});
