import { test, expect } from './fixtures'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Route guard', () => {
  test('unauthenticated user navigating to /transactions is redirected to /login', async ({
    page,
  }) => {
    await page.goto('/transactions', { waitUntil: 'load' })

    await expect(page).toHaveURL(/\/login/)
  })

  test('authenticated user via Dev Login can access /transactions without redirection', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await page.goto('/login', { waitUntil: 'load' })

    const devLoginButton = page.getByTestId('dev-login-button')
    await expect(devLoginButton).toBeVisible({ timeout: 15000 })
    await devLoginButton.click()

    await expect(page).toHaveURL(/\/dashboard/)
    // CSV mode: wizard shows; complete it to see dashboard (VITE_LOCAL_CSV_FIXTURE_FOLDER)
    await page.getByRole('button', { name: /local csv|csv local/i }).first().click()
    await page.getByRole('button', { name: /open existing shop|abrir tienda existente/i }).first().click()
    await page.getByRole('button', { name: /open existing shop|abrir tienda existente/i }).first().click()
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 5000,
    })
  })

  test('redirect after login returns to original path', async ({ page }) => {
    await page.goto('/transactions', { waitUntil: 'load' })

    await expect(page).toHaveURL(/\/login/)

    const devLoginButton = page.getByTestId('dev-login-button')
    await expect(devLoginButton).toBeVisible({ timeout: 15000 })
    await devLoginButton.click()

    await expect(page).toHaveURL(/\/transactions/)
  })

  test('authenticated user without active shop sees wizard overlay', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'load' })

    const devLoginButton = page.getByTestId('dev-login-button')
    await expect(devLoginButton).toBeVisible({ timeout: 15000 })
    await devLoginButton.click()

    await expect(page).toHaveURL(/\/dashboard/)
    // CSV mode: dev login does not set shop, wizard shows immediately
    await expect(
      page.getByRole('button', { name: /open existing shop|abrir tienda existente/i })
    ).toBeVisible({ timeout: 5000 })
  })
})
