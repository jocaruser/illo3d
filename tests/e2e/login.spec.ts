import { test, expect } from './fixtures'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Login flow', () => {
  test('login page shows illo3d brand and sign-in options', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'load' })

    await expect(page.getByRole('heading', { name: 'illo3d' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
  })

  test('dev login button is visible in development', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'load' })

    const devLoginButton = page.getByTestId('dev-login-button')
    await expect(devLoginButton).toBeVisible({ timeout: 15000 })
  })

  test('sign in with Google button is visible on login page load', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'load' })

    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible({
      timeout: 15000,
    })
  })

  test('dev login navigates to transactions page', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'load' })

    const devLoginButton = page.getByTestId('dev-login-button')
    await expect(devLoginButton).toBeVisible({ timeout: 15000 })

    await devLoginButton.click()

    await expect(page).toHaveURL(/\/transactions/)

    await expect(page.getByRole('link', { name: 'illo3d' })).toBeVisible()
  })
})

