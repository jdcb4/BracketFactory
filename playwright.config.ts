import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    // Use site origin only; tests use paths like `/BracketFactory/#/…` so `base` is not stripped.
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/BracketFactory/',
    reuseExistingServer: !process.env.CI,
  },
})
