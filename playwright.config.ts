/**
 * E2E policy (illo3d):
 * - Chromium only in CI and by default (no extra browser matrix).
 * - workers: 1 — single Vite server and one `.e2e-fixtures` tree; parallel workers would race CSV writes.
 *   Use test.describe.configure({ mode: 'serial' }) where tests in a file depend on order.
 * - fullyParallel: true lets independent files run in parallel when workers > 1 locally.
 * - retries: 2 on CI only to absorb rare timing flakes.
 *
 * The app must already be served (e.g. `make e2e-test` starts Vite and sets PLAYWRIGHT_BASE_URL).
 */
import { defineConfig, devices } from '@playwright/test'

const e2ePort = 5174
const e2eOrigin = `http://127.0.0.1:${e2ePort}`

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
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
