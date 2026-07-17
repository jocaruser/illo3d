import { test, expect } from './fixtures'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Entry and setup wizard', () => {
  test('/login redirects through / then dashboard and shows welcome wizard', async ({ page }) => {
    await page.goto('/#/login', { waitUntil: 'load' })

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-google-drive')).toBeVisible()
    // v3 gives every screen a single h1; the wizard is a full-screen gate, so it owns the page's.
    await expect(page.getByRole('heading', { name: 'illo3d', level: 1 })).toBeVisible()
  })

  test('dashboard without saved shop shows welcome wizard', async ({ page }) => {
    await page.goto('/#/dashboard', { waitUntil: 'load' })

    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-google-drive')).toBeVisible()
  })
})
