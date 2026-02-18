import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command:
        "cd ../backend && .venv\\Scripts\\python -m uvicorn forge.main:app --host 0.0.0.0 --port 7860",
      url: "http://localhost:7860/api/system/health",
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: "cd ../frontend && npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
