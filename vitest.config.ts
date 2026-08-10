import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    globals: true,
    // Prisma-touching tests share one database; running files in parallel makes
    // them clobber each other's rows.
    fileParallelism: false,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["src/e2e/**"],
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
});
