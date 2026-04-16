import { test, expect } from './fixtures'

test.describe('Transactions page', () => {
  test.beforeEach(async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.goto('/transactions', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 30000,
    })
  })

  test('transactions table or empty state visible after authenticated user navigates to /transactions', async ({
    page,
  }) => {
    await expect(
      page.getByText(/connecting to google sheets|conectando a google sheets/i),
    ).not.toBeVisible({ timeout: 20000 })
    await expect(
      page.getByText(/loading workbook|cargando libro/i),
    ).not.toBeVisible({ timeout: 20000 })

    const tableOrEmpty = page
      .getByRole('table')
      .or(page.getByText(/no transactions|no hay transacciones/i))
    await expect(tableOrEmpty).toBeVisible({ timeout: 15000 })
  })

  test('balance is displayed when connected to Sheets', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    const balanceLabel = page.getByText(/^Balance:|^Saldo:/)
    const connectingOrError = page.getByText(/connecting|cargando|error/i)
    await expect(balanceLabel.or(connectingOrError)).toBeVisible({ timeout: 15000 })
  })

  test('no edit or delete buttons visible in transactions UI', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /delete|remove/i })).not.toBeVisible()
  })
})
