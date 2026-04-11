import { test, expect } from './fixtures'

async function devLoginAndOpenShop(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'networkidle' })

  const devLoginButton = page.getByTestId('dev-login-button')
  await expect(devLoginButton).toBeVisible({ timeout: 15000 })
  await devLoginButton.click()

  await expect(page).toHaveURL(/\/transactions/)

  const openExistingButton = page.getByRole('button', {
    name: /open existing shop|abrir tienda existente/i,
  })
  if (await openExistingButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByRole('button', { name: /local csv|csv local/i }).first().click()
    await openExistingButton.first().click()
    await page.getByRole('button', { name: /open existing shop|abrir tienda existente/i }).first().click()
  }
}

test.describe('Navigation chrome', () => {
  test('login page has no breadcrumb landmark', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })
    await expect(
      page.getByRole('navigation', { name: /breadcrumb/i }),
    ).toHaveCount(0)
  })

  test('active nav and breadcrumbs on main pages', async ({ page }) => {
    await devLoginAndOpenShop(page)

    await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Transactions' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page).toHaveURL(/\/clients/)
    await expect(page.getByRole('link', { name: 'Clients' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible()
  })
})
