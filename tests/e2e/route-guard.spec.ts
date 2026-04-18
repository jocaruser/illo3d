import { test, expect, mockAndOpenLocalShop, mockDirectoryPicker } from './fixtures'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Route guard', () => {
  test('/login redirects through home and shows wizard, not a legacy login page', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'load' })
    await expect(page).not.toHaveURL(/\/login$/)
    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
  })

  test('user without shop sees setup wizard on /transactions', async ({ page }) => {
    await page.goto('/transactions', { waitUntil: 'load' })

    await expect(page).toHaveURL(/\/transactions/)
    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
  })

  test('completing local wizard allows access to transactions', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await mockAndOpenLocalShop(page, 'happy-path')

    await page.goto('/transactions', { waitUntil: 'load' })
    await expect(page).toHaveURL(/\/transactions/)
    await expect(page.getByTestId('wizard-local-folder')).not.toBeVisible({ timeout: 5000 })
    await expect(
      page.getByRole('heading', { name: /transactions|transacciones/i }),
    ).toBeVisible({ timeout: 15000 })
  })

  test('user without shop on /dashboard sees wizard until shop opens', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await page.goto('/dashboard', { waitUntil: 'load' })
    await mockDirectoryPicker(page, 'happy-path', 'with-metadata')

    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('wizard-local-folder').click()
    await expect(page.getByTestId('global-header-search')).toBeVisible({ timeout: 20000 })
  })
})
