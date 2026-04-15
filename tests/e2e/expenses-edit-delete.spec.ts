import { test, expect } from './fixtures'

test.describe('Expenses edit and delete', () => {
  test('edit expense updates amount in table', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })
    await page.getByRole('link', { name: /expenses|gastos/i }).click()
    await expect(page).toHaveURL(/\/expenses/)
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })

    const row = page.getByRole('row', { name: /PLA White/i })
    await row.getByRole('button', { name: /edit|editar/i }).click()
    await expect(
      page.getByRole('heading', { name: /edit expense|editar gasto/i })
    ).toBeVisible()

    await page.locator('#expense-amount').fill('31.50')
    await page.getByRole('button', { name: /save|guardar/i }).click()

    await expect(row.getByText(/31[.,]50/)).toBeVisible({ timeout: 20000 })
  })

  test('delete expense removes row', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })
    await page.getByRole('link', { name: /expenses|gastos/i }).click()
    await expect(page).toHaveURL(/\/expenses/)
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })

    const row = page.getByRole('row', { name: /Ender 3/i })
    await row.getByRole('button', { name: /delete|eliminar/i }).click()

    const confirmOverlay = page.locator('div.fixed.inset-0.z-\\[60\\]')
    await confirmOverlay
      .getByRole('button', { name: /delete|eliminar/i })
      .click()

    await expect(page.getByRole('row', { name: /Ender 3/i })).not.toBeVisible({
      timeout: 20000,
    })
  })
})
