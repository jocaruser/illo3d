import { expect, test, mockDirectoryPicker, waitForShopDataReady } from './fixtures'

async function openLocalShopExpectingMigration(
  page: import('@playwright/test').Page,
  scenario: string,
) {
  await page.goto('/#/dashboard', { waitUntil: 'load' })
  await page.evaluate(() => {
    localStorage.removeItem('shop-storage')
    localStorage.removeItem('backend-storage')
  })
  await page.reload({ waitUntil: 'load' })
  await mockDirectoryPicker(page, scenario, 'with-metadata')
  const localBtn = page.getByTestId('wizard-local-folder')
  await expect(localBtn).toBeVisible({ timeout: 15000 })
  await localBtn.click()
  await expect(page.getByTestId('wizard-migration-continue')).toBeVisible({
    timeout: 15000,
  })
}

async function answerBackupAndContinue(
  page: import('@playwright/test').Page,
  answer: 'yes' | 'no',
) {
  await page.getByTestId(`wizard-backup-${answer}`).click()
  const continueBtn = page.getByTestId('wizard-migration-continue')
  await expect(continueBtn).toBeEnabled({ timeout: 10000 })
  await continueBtn.click()
}

test.describe('migration wizard run', () => {
  test.use({ fixtureScenario: 'pre-v2-upgrade' })

  test('migrates a v1 local shop and opens it', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await openLocalShopExpectingMigration(page, 'pre-v2-upgrade')

    await answerBackupAndContinue(page, 'yes')

    await waitForShopDataReady(page)

    // The migrated shop passed validateStructure, so audit_log exists — check it renders.
    await page.goto('/#/audit-log', { waitUntil: 'load' })
    await expect(page.getByText(/migration/i).first()).toBeVisible({
      timeout: 15000,
    })
  })

  test('skipping the backup still migrates and opens the shop', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await openLocalShopExpectingMigration(page, 'pre-v2-upgrade')

    await expect(page.getByLabel('Backup: pending')).toBeVisible()
    await page.getByTestId('wizard-backup-no').click()
    await expect(page.getByLabel('Backup: done')).toBeVisible()

    const continueBtn = page.getByTestId('wizard-migration-continue')
    await expect(continueBtn).toBeEnabled({ timeout: 10000 })
    await continueBtn.click()

    await waitForShopDataReady(page)
  })
})

test.describe('migration wizard failure', () => {
  test.use({ fixtureScenario: 'pre-v2-bad-header' })

  test('a failing step turns its card red and halts the run', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await openLocalShopExpectingMigration(page, 'pre-v2-bad-header')

    await answerBackupAndContinue(page, 'yes')

    await expect(page.getByLabel('Jobs: failed')).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByTestId('wizard-migration-failed')).toBeVisible()
    await expect(page.getByLabel('Audit Log: pending')).toBeVisible()
    await expect(page.getByTestId('wizard-migration-logout')).toBeEnabled()

    // The source shop is untouched: leaving and reopening shows the migration modal again.
    await page.getByTestId('wizard-migration-logout').click()
    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({
      timeout: 15000,
    })
  })
})
