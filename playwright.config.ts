/**
 * E2E policy (illo3d):
 * - Chromium only in CI and by default (no extra browser matrix).
 * - workers: 1 — keeps CSV-backed state predictable; use test.describe.configure({ mode: 'serial' })
 *   inside files that mutate shared fixture data.
 * - fullyParallel: true lets independent files run in parallel when workers > 1 locally.
 * - retries: 2 on CI only to absorb rare timing flakes.
 */
import { defineConfig, devices } from '@playwright/test'

const e2ePort = 5174
const e2eOrigin = `http://127.0.0.1:${e2ePort}`
const skipWebServer = !!process.env.PLAYWRIGHT_SKIP_WEBSERVER

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? e2eOrigin,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: `pnpm exec vite --port ${e2ePort} --host 0.0.0.0`,
          url: e2eOrigin,
          reuseExistingServer: !process.env.CI,
          env: {
            ...process.env,
            NODE_ENV: 'development',
            VITE_FIXTURES_ROOT: '.e2e-fixtures',
            VITE_LOCAL_CSV_FIXTURE_FOLDER: 'happy-path',
            VITE_SHOW_DEV_LOGIN: 'true',
          },
        },
      }),
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
