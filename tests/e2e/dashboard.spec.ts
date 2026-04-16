import { test, expect } from './fixtures'

test.describe('Dashboard', () => {
  test('landing page shows kanban, balance stat, and dashboard nav active', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 10000,
    })

    await expect(
      page.getByRole('heading', { name: /jobs|trabajos/i }).first(),
    ).toBeVisible()

    await expect(page.getByRole('heading', { name: /draft|borrador/i })).toBeVisible()

    await expect(page.locator('a[href="/transactions"]').first()).toBeVisible()

    await expect(page.getByRole('link', { name: /dashboard|panel/i })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await page.getByRole('link', { name: /clients|clientes/i }).first().click()
    await expect(page).toHaveURL(/\/clients/)
    await expect(
      page.getByRole('link', { name: /dashboard|panel/i }).first(),
    ).not.toHaveAttribute('aria-current', 'page')
  })
})
