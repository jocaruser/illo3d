import {
  test,
  expect,
  mockAndOpenLocalShop,
} from './fixtures'
import { setMockDirectoryPermission } from './helpers/mockDirectoryPicker'

test.describe('Local folder re-allow on reopen', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('shows re-allow when folder permission lapsed after refresh', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await mockAndOpenLocalShop(page, 'happy-path')
    await setMockDirectoryPermission(page, 'prompt')

    await page.reload({ waitUntil: 'load' })

    await expect(page.getByTestId('local-folder-reallow')).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByTestId('global-header-search')).not.toBeVisible()
  })

  test('granting access reopens the shop without the folder picker', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await mockAndOpenLocalShop(page, 'happy-path')
    await setMockDirectoryPermission(page, 'prompt', 'granted')

    await page.reload({ waitUntil: 'load' })
    await expect(page.getByTestId('local-folder-reallow')).toBeVisible({
      timeout: 20000,
    })

    await page.getByTestId('local-folder-reallow-grant').click()

    await expect(page.getByTestId('local-folder-reallow')).not.toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByTestId('global-header-search')).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByTestId('wizard-local-folder')).not.toBeVisible()
  })

  test('declining re-allow returns to welcome and clears persisted shop', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await mockAndOpenLocalShop(page, 'happy-path')
    await setMockDirectoryPermission(page, 'prompt')

    await page.reload({ waitUntil: 'load' })
    await expect(page.getByTestId('local-folder-reallow')).toBeVisible({
      timeout: 20000,
    })

    await page.getByTestId('local-folder-reallow-decline').click()

    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({
      timeout: 20000,
    })
    const shopStorage = await page.evaluate(() =>
      localStorage.getItem('shop-storage')
    )
    const parsed = JSON.parse(shopStorage ?? '{}')
    expect(parsed.state?.activeShop ?? null).toBeNull()
  })
})
