/**
 * E2E policy (illo3d):
 * - Chromium only by default (no extra browser matrix).
 * - Setup project runs once per `playwright test`: seeds `.e2e-fixtures`, Dev Login + open Local CSV shop,
 *   saves `storageState` to `tests/e2e/.auth/storage-state.json`. Chromium project depends on setup and loads that file.
 * - workers: 1 — single Vite server and one `.e2e-fixtures` tree; parallel workers would race CSV writes.
 *   Use test.describe.configure({ mode: 'serial' }) where tests in a file depend on order.
 * - fullyParallel: true lets independent files run in parallel when workers > 1 locally.
 * - When `CI` is set (e.g. ad-hoc automation): retries 2 and GitHub reporter to absorb rare flakes.
 *
 * Specs that must start logged out or without a saved shop SHALL use
 * `test.use({ storageState: { cookies: [], origins: [] } })` on their describe block.
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
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/storage-state.json',
      },
    },
  ],
})
