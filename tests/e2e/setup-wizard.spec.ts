import {
  test,
  expect,
  completeWizardGoogleDriveWelcome,
  mockAndOpenLocalShop,
  mockDirectoryPicker,
  mockDriveApis,
  mockGoogleOAuth,
} from './fixtures'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Setup wizard', () => {
  test('welcome shows local folder and Google Drive options', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'load' })

    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-google-drive')).toBeVisible()
  })

  test('mocked local folder opens fixture shop and hides wizard', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await mockAndOpenLocalShop(page, 'happy-path')

    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByTestId('wizard-local-folder')).not.toBeVisible()
  })

  test('wizard stays until shop is set', async ({ page, prepareFixtureDir }) => {
    void prepareFixtureDir
    await page.goto('/dashboard', { waitUntil: 'load' })
    await mockDirectoryPicker(page, 'happy-path', 'with-metadata')
    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('wizard-local-folder').click()
    await expect(page.getByTestId('global-header-search')).toBeVisible({ timeout: 20000 })
  })

  test('local empty folder: confirm create opens a new shop', async ({ page, prepareFixtureDir }) => {
    void prepareFixtureDir
    await page.goto('/dashboard', { waitUntil: 'load' })
    await mockDirectoryPicker(page, 'happy-path', 'empty')
    await page.getByTestId('wizard-local-folder').click()
    await expect(page.getByTestId('wizard-create-confirm-action')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('wizard-create-confirm-action').click()
    await expect(page.getByTestId('global-header-search')).toBeVisible({ timeout: 20000 })
  })

  test('Google Drive step cancel returns to welcome', async ({ page, prepareFixtureDir }) => {
    void prepareFixtureDir
    await mockGoogleOAuth(page)
    await mockDriveApis(page)
    await page.goto('/dashboard', { waitUntil: 'load' })
    await completeWizardGoogleDriveWelcome(page)
    await expect(page.getByTestId('wizard-google-cancel')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('wizard-google-cancel').click()
    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-google-drive')).toBeVisible()
  })
})
