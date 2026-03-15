import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('dev login navigates to transactions page', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })

    const devLoginButton = page.getByTestId('dev-login-button')
    await expect(devLoginButton).toBeVisible({ timeout: 15000 })

    await devLoginButton.click()

    await expect(page).toHaveURL(/\/transactions/)

    await expect(page.getByRole('link', { name: 'illo3d' })).toBeVisible()
  })
})

