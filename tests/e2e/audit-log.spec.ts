import { test, expect } from './fixtures'

test.describe('Audit Log page', () => {
  test.use({ storageState: 'tests/e2e/.auth/storage-state.json' })

  test('navigates from header, shows title and empty state', async ({ page }) => {
    await page.goto('/#/dashboard', { waitUntil: 'load' })

    await page.getByRole('link', { name: 'Audit Log' }).click()
    await expect(page).toHaveURL(/\/audit-log/)

    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByText(/no audit entries yet|aún no hay entradas de auditoría/i)
    ).toBeVisible()
  })

  test('direct navigation shows audit log empty state', async ({ page }) => {
    await page.goto('/#/audit-log', { waitUntil: 'load' })

    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByText(/no audit entries yet|aún no hay entradas de auditoría/i)
    ).toBeVisible()
  })
})
