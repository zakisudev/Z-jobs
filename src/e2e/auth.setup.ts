import { test as setup, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import path from "node:path";

/**
 * Registers one account and saves its session for every test that needs to be
 * signed in.
 *
 * Registering per-test would exceed the 3/hour/IP cap after three tests. The
 * limit is deliberately NOT relaxed for tests — a suite that passes against
 * weakened limits proves nothing about production — so the session is created
 * once and reused, which is faster anyway.
 */

export const STORAGE_STATE = path.join(process.cwd(), "test-results/.auth/user.json");
export const SHELL_PASSWORD = "correct-horse-battery-42";

const db = new PrismaClient();

setup("authenticate", async ({ page }) => {
  const email = `shell-${Date.now()}@shell-e2e.local`;

  await page.goto("/register");
  await page.getByLabel("First name").fill("Hana");
  await page.getByLabel("Last name").fill("Tesfaye");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(SHELL_PASSWORD);
  await page.getByLabel("Confirm password").fill(SHELL_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  // Verify directly so the shell tests aren't dominated by the unverified
  // banner; the verification flow itself is covered in auth.spec.ts.
  await db.user.update({
    where: { email },
    data: { emailVerifiedAt: new Date() },
  });
  await db.$disconnect();

  await page.context().storageState({ path: STORAGE_STATE });
});
