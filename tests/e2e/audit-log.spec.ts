import { test, expect } from './fixtures'

test.describe('Audit Log page', () => {
  test('navigates from header, shows title and empty state', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 10000,
    })

    await page.getByTestId('nav-audit-log').click()
    await expect(page).toHaveURL(/\/audit-log/)

    await expect(page.getByTestId('audit-log-page')).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('audit-log-empty-state')).toBeVisible()
  })

  test('direct navigation shows audit log empty state', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.goto('/#/audit-log', { waitUntil: 'load' })

    await expect(page.getByTestId('audit-log-page')).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('audit-log-empty-state')).toBeVisible()
  })
})
