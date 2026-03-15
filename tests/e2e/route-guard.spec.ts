import { test, expect } from '@playwright/test'

test.describe('Route guard', () => {
  test('unauthenticated user navigating to /transactions is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/transactions', { waitUntil: 'networkidle' })

    await expect(page).toHaveURL(/\/login/)
  })

  test('authenticated user via Dev Login can access /transactions without redirection', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })

    const devLoginButton = page.getByTestId('dev-login-button')
    await expect(devLoginButton).toBeVisible({ timeout: 15000 })
    await devLoginButton.click()

    await expect(page).toHaveURL(/\/transactions/)
    // CSV mode: wizard shows; complete it to see Transactions
    await page.getByRole('button', { name: 'Open existing folder' }).click()
    await page.getByPlaceholder('e.g. happy-path, missingcolumn').fill('happy-path')
    await page.getByRole('button', { name: 'Open' }).click()
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 5000,
    })
  })

  test('redirect after login returns to original path', async ({ page }) => {
    await page.goto('/transactions', { waitUntil: 'networkidle' })

    await expect(page).toHaveURL(/\/login/)

    const devLoginButton = page.getByTestId('dev-login-button')
    await expect(devLoginButton).toBeVisible({ timeout: 15000 })
    await devLoginButton.click()

    await expect(page).toHaveURL(/\/transactions/)
  })

  test('authenticated user without active shop sees wizard overlay', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })

    const devLoginButton = page.getByTestId('dev-login-button')
    await expect(devLoginButton).toBeVisible({ timeout: 15000 })
    await devLoginButton.click()

    await expect(page).toHaveURL(/\/transactions/)
    // CSV mode: dev login does not set shop, wizard shows immediately
    await expect(
      page.getByRole('button', { name: 'Open existing folder' })
    ).toBeVisible({ timeout: 5000 })
  })
})
