import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const PORT = Number(process.env.E2E_PORT ?? 3210);
const baseURL = `http://127.0.0.1:${PORT}`;
const STORAGE_STATE = path.join(process.cwd(), "test-results/.auth/user.json");

export default defineConfig({
  testDir: "./src/e2e",
  globalSetup: "./src/e2e/global-setup.ts",
  fullyParallel: false, // shared database
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL,
    trace: "on-first-retry",
  },

  // The dev server compiles each route on first visit, which regularly exceeds
  // the 5s default on a cold run. Raised so first-hit compilation isn't
  // reported as a product failure.
  expect: { timeout: 20_000 },
  timeout: 90_000,

  projects: [
    // Registers once and stores the session; everything below reuses it so the
    // suite stays inside the 3/hour registration cap.
    { name: "setup", testMatch: /auth\.setup\.ts/ },

    // The auth flows manage their own accounts and must start signed out.
    {
      name: "auth-flows",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Mobile coverage comes from per-test `test.use({ viewport })` inside the
    // specs rather than a second project: a duplicate project would re-run every
    // desktop test at phone width and vice versa. Chromium emulates the
    // viewports; add a WebKit project once `playwright install webkit` is part
    // of CI setup.
    {
      name: "chromium",
      testIgnore: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    // dev mode: `next start` refuses to boot without an https APP_URL, which is
    // correct behaviour and not something to weaken for tests.
    command: `pnpm dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
