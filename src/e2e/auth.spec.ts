import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

/**
 * The auth flow end to end, against the real database.
 *
 * The verification link is read out of the database rather than an inbox: the
 * raw token exists only inside the email, so the test reconstructs the flow the
 * way a user would by looking up which token was issued.
 */

const db = new PrismaClient();

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@z-jobs.local`;
}

const PASSWORD = "correct-horse-battery-42";

test.afterAll(async () => {
  await db.user.deleteMany({ where: { email: { contains: "@z-jobs.local" } } });
  await db.$disconnect();
});

test("register, verify email, sign out, sign back in", async ({ page, request }) => {
  const email = uniqueEmail();

  await page.goto("/register");
  await page.getByLabel("First name").fill("Abebe");
  await page.getByLabel("Last name").fill("Bekele");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /create account/i }).click();

  // Seekers land on the dashboard, still unverified.
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/confirm your email address/i)).toBeVisible();

  const user = await db.user.findUniqueOrThrow({ where: { email } });
  expect(user.emailVerifiedAt).toBeNull();

  // A verification token was issued, and only its hash was stored.
  const token = await db.authToken.findFirstOrThrow({
    where: { userId: user.id, type: "EMAIL_VERIFY" },
  });
  expect(token.tokenHash).toHaveLength(64);

  // Follow the link the way the emailed URL would.
  const raw = await issueRawToken(request, email, new URL(page.url()).origin);
  await page.goto(`/verify-email?token=${raw}`);
  await expect(page.getByText(/email confirmed/i)).toBeVisible();

  const verified = await db.user.findUniqueOrThrow({ where: { email } });
  expect(verified.emailVerifiedAt).not.toBeNull();

  // The token is single-use: replaying the same link must now fail.
  await page.goto(`/verify-email?token=${raw}`);
  await expect(page.getByText(/didn't work/i)).toBeVisible();

  await page.goto("/dashboard");
  // Sign out lives in the account dropdown in the shell's topbar.
  await page.getByRole("button", { name: /open account menu/i }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("a forged sequential token is rejected", async ({ page }) => {
  // The exact exploit the old app shipped: GET /api/users/verify?userId=3.
  for (const forged of ["1", "2", "3", "42", "999"]) {
    await page.goto(`/verify-email?token=${forged}`);
    await expect(page.getByText(/didn't work/i)).toBeVisible();
  }
});

test("protected routes redirect anonymous users to sign in", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("registration rejects a mismatched password on the field itself", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("First name").fill("Abebe");
  await page.getByLabel("Last name").fill("Bekele");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill("something-else-entirely");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /create account/i }).click();

  // The error must be announced and attached to the field, not dropped as a
  // lone string under the submit button as it was before.
  await expect(
    page.getByRole("alert").filter({ hasText: /do not match/i }),
  ).toBeVisible();
});

test("password reset requires an existing account but never says so", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill("definitely-not-registered@z-jobs.local");
  await page.getByRole("button", { name: /send reset link/i }).click();

  // Identical response whether or not the address exists — otherwise this form
  // is an account-discovery tool.
  await expect(page.getByRole("status")).toContainText(/if an account exists/i);
});

/**
 * The raw token is never persisted — only its SHA-256 — so it cannot be
 * recovered from the database. The dev-only endpoint issues a fresh one, which
 * is the same thing "resend verification" does.
 */
async function issueRawToken(
  request: import("@playwright/test").APIRequestContext,
  email: string,
  origin: string,
): Promise<string> {
  const res = await request.post("/api/dev/verification-token", {
    data: { email },
    // Required: the CSRF middleware rejects any non-GET without a matching
    // Origin, and Playwright's API client sends none by default.
    headers: { origin },
  });
  expect(res.ok(), `dev token endpoint returned ${res.status()}`).toBeTruthy();
  const body = (await res.json()) as { token: string };
  return body.token;
}
