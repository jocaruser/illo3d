import { test as base, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/** Must match `sanitizeFixtureFolderId` in src/config/csvBackend.ts */
function e2eDestinationFolderName(): string {
  const raw = process.env.VITE_LOCAL_CSV_FIXTURE_FOLDER?.trim()
  if (raw && /^[a-zA-Z0-9_-]+$/.test(raw)) return raw
  return 'happy-path'
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
  /** Opt-in: completes Dev Login and opens the CSV shop (see `devLoginAndOpenCsvShop`). */
  openCsvShop: void
}>({
  fixtureScenario: ['happy-path', { option: true }],
  prepareFixtureDir: [
    async ({ fixtureScenario }, use) => {
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
      await use()
    },
    { auto: false },
  ],
  openCsvShop: [
    async ({ page, prepareFixtureDir }, use) => {
      void prepareFixtureDir
      await devLoginAndOpenCsvShop(page)
      await use()
    },
    { auto: false },
  ],
})

export { expect }
