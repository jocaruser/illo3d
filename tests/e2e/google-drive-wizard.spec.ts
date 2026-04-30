import {
  completeWizardGoogleDriveWelcome,
  mockAndOpenGoogleShop,
  mockDriveApis,
  mockGoogleOAuth,
  waitForShopDataReady,
  test,
  expect,
} from './fixtures'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Google Drive setup wizard', () => {
  test('mocked OAuth creates a new Drive shop', async ({ page }) => {
    await mockAndOpenGoogleShop(page)
  })

  test('folder ID submit with empty input shows validation', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page)
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await completeWizardGoogleDriveWelcome(page)
    await expect(page.getByTestId('wizard-google-open-by-id')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('wizard-google-open-by-id').click()
    await expect(
      page.getByText(/Please enter a folder ID|Introduce un ID de carpeta/i),
    ).toBeVisible({ timeout: 5000 })
  })

  test('paste folder ID opens shop when Drive metadata validates', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page, { pasteFolderMode: 'ok' })
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await completeWizardGoogleDriveWelcome(page)
    await expect(page.getByTestId('wizard-google-open-by-id')).toBeVisible({ timeout: 15000 })
    await page.locator('#wizard-folder-id').fill('e2ePasteFolder1')
    await page.getByTestId('wizard-google-open-by-id').click()
    await expect(page.getByTestId('global-header-search')).toBeVisible({ timeout: 20000 })
  })

  test('paste folder ID shows error when folder is not a shop', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page, { pasteFolderMode: 'not_shop' })
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await completeWizardGoogleDriveWelcome(page)
    await page.locator('#wizard-folder-id').fill('notAShopFolder')
    await page.getByTestId('wizard-google-open-by-id').click()
    await expect(
      page.getByText(/This folder is not an illo3d shop|Esta carpeta no es una tienda illo3d/i),
    ).toBeVisible({ timeout: 10000 })
  })

  test('paste folder ID shows error on metadata version mismatch', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page, { pasteFolderMode: 'bad_version' })
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await completeWizardGoogleDriveWelcome(page)
    await page.locator('#wizard-folder-id').fill('oldVersionFolder')
    await page.getByTestId('wizard-google-open-by-id').click()
    await expect(
      page.getByText(/different app version|otra versión de la app/i),
    ).toBeVisible({ timeout: 10000 })
  })

  test('paste folder ID shows error when sheet headers fail validation', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page, { pasteFolderMode: 'bad_headers' })
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await completeWizardGoogleDriveWelcome(page)
    await page.locator('#wizard-folder-id').fill('badHeadersFolder')
    await page.getByTestId('wizard-google-open-by-id').click()
    // When headers fail validation, the app shows structure error with detail
    // Error message: "This shop's Google Sheet does not match the layout this app expects: ..."
    await expect(
      page.getByText(/does not match the layout|no coincide con el formato/i),
    ).toBeVisible({ timeout: 10000 })
  })

  test('open existing via picker is disabled, paste-id still works', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page, { pasteFolderMode: 'ok' })
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await completeWizardGoogleDriveWelcome(page)
    await expect(page.getByTestId('wizard-google-open-picker')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-google-open-picker')).toBeDisabled()
    // Paste-ID flow still works
    await page.locator('#wizard-folder-id').fill('e2ePasteFolder1')
    await page.getByTestId('wizard-google-open-by-id').click()
    await waitForShopDataReady(page)
  })
})
