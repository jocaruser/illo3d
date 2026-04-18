import { test, expect } from './fixtures'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Entry and setup wizard', () => {
  test('/login redirects through / then dashboard and shows welcome wizard', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'load' })

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-google-drive')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'illo3d', level: 3 })).toBeVisible()
  })

  test('dashboard without saved shop shows welcome wizard', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'load' })

    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-google-drive')).toBeVisible()
  })
})
