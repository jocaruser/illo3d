import { test, expect } from './fixtures'

test.describe('Transactions page', () => {
  test('transactions table or empty state visible after authenticated user navigates to /transactions', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    const transactionsHeading = page.getByRole('heading', { name: 'Transactions' })
    await expect(transactionsHeading).toBeVisible({ timeout: 10000 })

    const tableOrContent = page
      .getByRole('table')
      .or(page.getByText(/no transactions|no hay transacciones/i))
      .or(page.getByText(/connecting|cargando/i))
      .or(page.getByText(/loading/i))
      .or(page.getByText(/error|retry|reintentar/i))
    await expect(tableOrContent).toBeVisible({ timeout: 15000 })
  })

  test('balance is displayed when connected to Sheets', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    const balanceLabel = page.getByText(/^Balance:|^Saldo:/)
    const connectingOrError = page.getByText(/connecting|cargando|error/i)
    await expect(balanceLabel.or(connectingOrError)).toBeVisible({ timeout: 15000 })
  })

  test('no edit or delete buttons visible in transactions UI', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /delete|remove/i })).not.toBeVisible()
  })
})
