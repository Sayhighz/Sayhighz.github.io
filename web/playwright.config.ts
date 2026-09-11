import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 1440, height: 900 },
    channel: "chrome",
    trace: "retain-on-failure",
  },
  webServer: {
    // The site is a static export (`output: "export"`), which `next start`
    // refuses to serve — tests run against the exported files themselves, which
    // is also exactly what GitHub Pages will serve.
    command: "npx --yes serve@14 out --listen 3100 --no-clipboard",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
