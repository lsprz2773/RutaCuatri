import { defineConfig, devices } from "@playwright/test";

// Las pruebas corren contra la exportación estática (npm run build genera out/).
export default defineConfig({
  testDir: "pruebas/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/servir.ts 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
  },
});
