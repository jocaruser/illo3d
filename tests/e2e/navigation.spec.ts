import { test, expect } from './fixtures'

test.describe('Navigation chrome', () => {
  test('login page has no breadcrumb landmark', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'load' })
    await expect(
      page.getByRole('navigation', { name: /breadcrumb/i }),
    ).toHaveCount(0)
  })

  test('active nav and breadcrumbs on main pages', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.locator('[aria-modal="true"]')).toHaveCount(0, {
      timeout: 20000,
    })
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 20000,
    })

    await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /dashboard|panel/i })).toHaveAttribute(
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
