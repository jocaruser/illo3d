import { test as base, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/** Must match `sanitizeFixtureFolderId` in src/config/csvBackend.ts */
function e2eDestinationFolderName(): string {
  const raw = process.env.VITE_LOCAL_CSV_FIXTURE_FOLDER?.trim()
  if (raw && /^[a-zA-Z0-9_-]+$/.test(raw)) return raw
  return 'happy-path'
}

/** Copy `fixtures/<fixtureScenario>/` into `.e2e-fixtures` (used by setup + `prepareFixtureDir`). */
export function copyGoldenFixtureToE2eRoot(fixtureScenario: string): void {
  const goldenDir = path.join(process.cwd(), 'fixtures', fixtureScenario)
  if (!fs.existsSync(goldenDir)) {
    throw new Error(`Golden fixture scenario not found: ${fixtureScenario}`)
  }
  const destRoot = path.join(process.cwd(), '.e2e-fixtures')
  const wizardFolder = e2eDestinationFolderName()

  fs.rmSync(destRoot, { recursive: true, force: true })
  fs.mkdirSync(destRoot, { recursive: true })

  const copyInto = (relative: string) => {
    const dest = path.join(destRoot, relative)
    fs.cpSync(goldenDir, dest, { recursive: true })
  }

  copyInto(fixtureScenario)
  if (fixtureScenario !== wizardFolder) {
    copyInto(wizardFolder)
  }
}

export async function waitForShopDataReady(page: Page) {
  await expect(
    page.getByText(/connecting to google sheets|conectando a google sheets/i),
  ).not.toBeVisible({ timeout: 20000 })
  await expect(
    page.getByRole('heading', { name: /transactions|transacciones/i }),
  ).toBeVisible({ timeout: 20000 })
  // Zustand persist rehydrates async; header search only mounts when `activeShop` is set (no wizard overlay).
  await expect(page.getByTestId('global-header-search')).toBeVisible({
    timeout: 20000,
  })
}

/** Dev Login + Local CSV “open existing shop” for the active `fixtureScenario`. */
export async function devLoginAndOpenCsvShop(page: Page) {
  await page.goto('/login', { waitUntil: 'load' })

  const devLoginButton = page.getByTestId('dev-login-button')
  await expect(devLoginButton).toBeVisible({ timeout: 15000 })
  await devLoginButton.click()

  await expect(page).toHaveURL(/\/transactions/)

  const openExistingButton = page.getByRole('button', {
    name: /open existing shop|abrir tienda existente/i,
  })
  await expect(openExistingButton.first()).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /local csv|csv local/i }).first().click()
  await openExistingButton.first().click()
  await page
    .getByRole('button', { name: /open existing shop|abrir tienda existente/i })
    .first()
    .click()
}

export const test = base.extend<{
  fixtureScenario: string
  /** Reset `.e2e-fixtures` from `fixtures/<fixtureScenario>/`. Runs when opening the CSV shop or when a test pulls this in explicitly (e.g. manual wizard completion). */
  prepareFixtureDir: void
  /** Opt-in: uses saved `storageState` from setup, resets fixtures, opens `/transactions`, waits for data-ready. */
  openCsvShop: void
}>({
  fixtureScenario: ['happy-path', { option: true }],
  prepareFixtureDir: [
    async ({ fixtureScenario }, use) => {
      copyGoldenFixtureToE2eRoot(fixtureScenario)
      await use()
    },
    { auto: false },
  ],
  openCsvShop: [
    async ({ page, prepareFixtureDir }, use) => {
      void prepareFixtureDir
      await page.goto('/transactions', { waitUntil: 'load' })
      await waitForShopDataReady(page)
      await use()
    },
    { auto: false },
  ],
})

export { expect }
