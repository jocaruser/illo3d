import {
  mockAndOpenGoogleShop,
  mockDriveApis,
  mockGoogleOAuth,
  mockGooglePickerApi,
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
    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.getByTestId('wizard-google-drive').click()
    await expect(page.getByTestId('wizard-google-open-by-id')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('wizard-google-open-by-id').click()
    await expect(
      page.getByText(/Please enter a folder ID|Introduce un ID de carpeta/i),
    ).toBeVisible({ timeout: 5000 })
  })

  test('paste folder ID opens shop when Drive metadata validates', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page, { pasteFolderMode: 'ok' })
    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.getByTestId('wizard-google-drive').click()
    await expect(page.getByTestId('wizard-google-open-by-id')).toBeVisible({ timeout: 15000 })
    await page.locator('#wizard-folder-id').fill('e2ePasteFolder1')
    await page.getByTestId('wizard-google-open-by-id').click()
    await expect(page.getByTestId('global-header-search')).toBeVisible({ timeout: 20000 })
  })

  test('paste folder ID shows error when folder is not a shop', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page, { pasteFolderMode: 'not_shop' })
    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.getByTestId('wizard-google-drive').click()
    await page.locator('#wizard-folder-id').fill('notAShopFolder')
    await page.getByTestId('wizard-google-open-by-id').click()
    await expect(
      page.getByText(/This folder is not an illo3d shop|Esta carpeta no es una tienda illo3d/i),
    ).toBeVisible({ timeout: 10000 })
  })

  test('paste folder ID shows error on metadata version mismatch', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page, { pasteFolderMode: 'bad_version' })
    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.getByTestId('wizard-google-drive').click()
    await page.locator('#wizard-folder-id').fill('oldVersionFolder')
    await page.getByTestId('wizard-google-open-by-id').click()
    await expect(
      page.getByText(/different app version|otra versión de la app/i),
    ).toBeVisible({ timeout: 10000 })
  })

  test('paste folder ID shows error when sheet headers fail validation', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page, { pasteFolderMode: 'bad_headers' })
    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.getByTestId('wizard-google-drive').click()
    await page.locator('#wizard-folder-id').fill('badHeadersFolder')
    await page.getByTestId('wizard-google-open-by-id').click()
    await expect(
      page.getByText(/do not have permission to access this shop|No tienes permiso para acceder/i),
    ).toBeVisible({ timeout: 10000 })
  })

  test('open existing via picker uses mocked folder selection', async ({ page }) => {
    await mockGoogleOAuth(page)
    await mockDriveApis(page, { pasteFolderMode: 'ok' })
    await mockGooglePickerApi(page)
    await page.goto('/dashboard', { waitUntil: 'load' })
    await page.getByTestId('wizard-google-drive').click()
    await expect(page.getByTestId('wizard-google-open-picker')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('wizard-google-open-picker').click()
    await expect(page.getByTestId('global-header-search')).toBeVisible({ timeout: 20000 })
  })
})
