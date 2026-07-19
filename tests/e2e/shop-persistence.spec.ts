import {
  test,
  expect,
  mockAndOpenGoogleShop,
  mockAndOpenLocalShop,
} from './fixtures'
import { MOCK_SPREADSHEET_ID } from './helpers/mockDriveApis'

test.describe('Shop persistence across refresh', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('Google Drive shop reopens with same spreadsheetId after refresh', async ({ page }) => {
    await mockAndOpenGoogleShop(page)

    // Verify activeShop was persisted with the mocked spreadsheetId
    const shopStorage = await page.evaluate(() => localStorage.getItem('shop-storage'))
    expect(shopStorage).not.toBeNull()
    const parsed = JSON.parse(shopStorage!)
    expect(parsed.state.activeShop.spreadsheetId).toBe(MOCK_SPREADSHEET_ID)

    // Refresh page
    await page.reload({ waitUntil: 'load' })

    // Shop should reopen (dashboard visible, wizard hidden)
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByTestId('wizard-local-folder')).not.toBeVisible()
  })

  test('local CSV shop does not silently fallback to fixtures after refresh', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await mockAndOpenLocalShop(page, 'happy-path')

    // Verify activeShop was persisted and folderId matches directory name
    const shopStorage = await page.evaluate(() => localStorage.getItem('shop-storage'))
    expect(shopStorage).not.toBeNull()
    const parsed = JSON.parse(shopStorage!)
    const folderId = parsed.state.activeShop.folderId as string
    expect(folderId).toBeTruthy()

    // Verify backend is local-csv in persisted storage
    const backendStorage = await page.evaluate(() => localStorage.getItem('backend-storage'))
    expect(backendStorage).not.toBeNull()
    const backendParsed = JSON.parse(backendStorage!)
    expect(backendParsed.state.backend).toBe('local-csv')
    // localDirectoryHandle is intentionally NOT persisted
    expect(backendParsed.state.localDirectoryHandle).toBeUndefined()

    // Refresh page
    await page.reload({ waitUntil: 'load' })

    // activeShop is still persisted, and localDirectoryHandle is restored from IndexedDB,
    // so the shop reopens without silently falling back to fixtures.
    await expect(page.getByTestId('global-header-search')).toBeVisible({ timeout: 20000 })
  })
})
