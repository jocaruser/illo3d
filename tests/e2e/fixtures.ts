import { test as base, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { mockDirectoryPicker } from './helpers/mockDirectoryPicker'
import { mockDriveApis } from './helpers/mockDriveApis'
import { mockGoogleOAuth } from './helpers/mockGoogleOAuth'
import { mockGooglePickerApi } from './helpers/mockGooglePicker'

export { mockDirectoryPicker }
export { mockDriveApis, mockGoogleOAuth, mockGooglePickerApi }
export type { DriveApisMockOptions } from './helpers/mockDriveApis'

/** Copy `fixtures/<fixtureScenario>/` into `.e2e-fixtures` (used by setup + `prepareFixtureDir`). */
export function copyGoldenFixtureToE2eRoot(fixtureScenario: string): void {
  const goldenDir = path.join(process.cwd(), 'fixtures', fixtureScenario)
  if (!fs.existsSync(goldenDir)) {
    throw new Error(`Golden fixture scenario not found: ${fixtureScenario}`)
  }
  const destRoot = path.join(process.cwd(), '.e2e-fixtures')

  fs.rmSync(destRoot, { recursive: true, force: true })
  fs.mkdirSync(destRoot, { recursive: true })

  fs.cpSync(goldenDir, path.join(destRoot, fixtureScenario), { recursive: true })
}

export async function waitForShopDataReady(page: Page) {
  await expect(
    page.getByText(/connecting to google sheets|conectando a google sheets/i),
  ).not.toBeVisible({ timeout: 20000 })
  await expect(
    page.getByRole('heading', { name: /dashboard|panel/i }),
  ).toBeVisible({ timeout: 20000 })
  // Zustand persist rehydrates async; header search only mounts when `activeShop` is set (no wizard overlay).
  await expect(page.getByTestId('global-header-search')).toBeVisible({
    timeout: 20000,
  })
}

/**
 * Wizard welcome: first Google Drive click expresses Drive intent (One Tap may run);
 * second click runs the OAuth token client (mocked in e2e).
 */
export async function completeWizardGoogleDriveWelcome(page: Page): Promise<void> {
  const driveBtn = page.getByTestId('wizard-google-drive')
  await driveBtn.click()
  await driveBtn.click()
}

/** Wizard: mock directory picker + open local fixture shop for `fixtureScenario`. */
export async function mockAndOpenLocalShop(page: Page, fixtureScenario = 'happy-path') {
  await page.goto('/dashboard', { waitUntil: 'load' })
  await mockDirectoryPicker(page, fixtureScenario, 'with-metadata')
  const localBtn = page.getByTestId('wizard-local-folder')
  await expect(localBtn).toBeVisible({ timeout: 15000 })
  await localBtn.click()
  await waitForShopDataReady(page)
}

/**
 * Wizard: mock GSI + userinfo + Drive/Sheets APIs, complete Google OAuth, then create a new Drive shop.
 * `fixtureScenario` is reserved for future fixture-backed Drive scenarios.
 */
export async function mockAndOpenGoogleShop(
  page: Page,
  _fixtureScenario: string = 'happy-path',
): Promise<void> {
  void _fixtureScenario
  await mockGoogleOAuth(page)
  await mockDriveApis(page)
  await page.goto('/dashboard', { waitUntil: 'load' })
  const driveBtn = page.getByTestId('wizard-google-drive')
  await expect(driveBtn).toBeVisible({ timeout: 15000 })
  await completeWizardGoogleDriveWelcome(page)
  await expect(page.getByTestId('wizard-google-create')).toBeVisible({ timeout: 15000 })
  await page.getByTestId('wizard-google-create').click()
  await waitForShopDataReady(page)
}

export const test = base.extend<{
  fixtureScenario: string
  /** Reset `.e2e-fixtures` from `fixtures/<fixtureScenario>/`. Runs when opening the CSV shop or when a test pulls this in explicitly (e.g. manual wizard completion). */
  prepareFixtureDir: void
  /** Opt-in: uses saved `storageState` from setup, resets fixtures, opens `/dashboard`, waits for data-ready. */
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
      await page.goto('/dashboard', { waitUntil: 'load' })
      await waitForShopDataReady(page)
      await use()
    },
    { auto: false },
  ],
})

export { expect }
