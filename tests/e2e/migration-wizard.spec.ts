import type { Page } from '@playwright/test'
import { test, expect, mockDirectoryPicker } from './fixtures'

/**
 * The migration wizard, end to end on the local backend: opening a shop whose
 * metadata major lags the app's opens the modal; Continue runs the plan chain
 * against a working copy and flips the version as the final commit, so the
 * shop opens normally afterwards.
 *
 * `serial`: all specs share the one `.e2e-fixtures` tree.
 */
test.describe.configure({ mode: 'serial' })

test.use({ storageState: { cookies: [], origins: [] } })

async function openShopExpectingMigration(page: Page, scenario: string): Promise<void> {
  await page.goto('/#/dashboard', { waitUntil: 'load' })
  await mockDirectoryPicker(page, scenario, 'with-metadata')
  const localButton = page.getByTestId('wizard-local-folder')
  await expect(localButton).toBeVisible({ timeout: 15000 })
  await localButton.click()
  await expect(page.getByTestId('wizard-migration-continue')).toBeVisible({ timeout: 15000 })
}

async function answerBackupAndContinue(
  page: Page,
  answer: 'wizard-backup-yes' | 'wizard-backup-no'
): Promise<void> {
  const continueButton = page.getByTestId('wizard-migration-continue')
  await expect(continueButton).toBeDisabled()
  await page.getByTestId(answer).click()
  // The 5s cooldown ring gives way to a checkmark; only then does Continue arm.
  await expect(page.getByTestId('wizard-cooldown-check')).toBeVisible({ timeout: 10000 })
  await expect(continueButton).toBeEnabled()
  await continueButton.click()
}

test.describe('Migration wizard: v2 shop', () => {
  test.use({ fixtureScenario: 'pre-v3-upgrade' })

  test('migrates to v3 after skipping the backup', async ({ page, prepareFixtureDir }) => {
    void prepareFixtureDir
    await openShopExpectingMigration(page, 'pre-v3-upgrade')

    // The modal names both versions.
    await expect(page.getByText('2.0.0')).toBeVisible()
    await expect(page.getByText('3.0.0')).toBeVisible()

    // Declining the backup warns; deselecting withdraws the warning.
    await page.getByTestId('wizard-backup-no').click()
    await expect(page.getByTestId('wizard-backup-warning')).toBeVisible()
    await page.getByTestId('wizard-backup-no').click()
    await expect(page.getByTestId('wizard-backup-warning')).not.toBeVisible()

    await answerBackupAndContinue(page, 'wizard-backup-no')

    // The migrated shop opens without re-picking the folder.
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByTestId('global-header-search')).toBeVisible()
  })

  test('log out abandons the migration and returns to the welcome screen', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await openShopExpectingMigration(page, 'pre-v3-upgrade')

    await page.getByTestId('wizard-migration-logout').click()

    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-migration-continue')).toHaveCount(0)
  })
})

test.describe('Migration wizard: v1 shop', () => {
  test.use({ fixtureScenario: 'pre-v2-upgrade' })

  test('chains v1→v2→v3 and backfills the audit log', async ({ page, prepareFixtureDir }) => {
    void prepareFixtureDir
    await openShopExpectingMigration(page, 'pre-v2-upgrade')

    await expect(page.getByText('1.5.0')).toBeVisible()
    await expect(page.getByText('3.0.0')).toBeVisible()

    await answerBackupAndContinue(page, 'wizard-backup-yes')

    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })

    // The v1→v2 plan recorded every pre-existing row as a `migration` entry.
    // (Scope to the table body: the filter <select> also holds a hidden
    // "Migration" <option>, which `getByText` would match first.)
    await page.goto('/#/audit-log', { waitUntil: 'load' })
    await expect(page.getByTestId('audit-log-page')).toBeVisible({ timeout: 15000 })
    await expect(
      page.locator('tbody tr').filter({ hasText: /migration/i }).first()
    ).toBeVisible()
    await expect(page.getByTestId('audit-log-empty-state')).toHaveCount(0)
  })
})
