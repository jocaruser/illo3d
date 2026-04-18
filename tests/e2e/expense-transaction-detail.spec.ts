import { test, expect } from './fixtures'

test.describe('Expense transaction detail', () => {
  test.beforeEach(async ({ page, openCsvShop }) => {
    void openCsvShop
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 20000 })
  })

  test('opens expense detail from transactions table id link', async ({ page }) => {
    await page.getByRole('link', { name: /transactions|transacciones/i }).click()
    await expect(page).toHaveURL(/\/transactions$/)
    await expect(
      page.getByRole('heading', { name: /transactions|transacciones/i }),
    ).toBeVisible({ timeout: 15000 })

    await page.getByTestId('transaction-expense-detail-link-T11').click()
    await expect(page).toHaveURL(/\/transactions\/T11/)
    await expect(page.getByRole('heading', { name: /PLA White/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('heading', { name: /linked lots|lotes vinculados/i })).toBeVisible()
  })

  test('inventory lot transaction links to expense detail', async ({ page }) => {
    await page.goto('/inventory/INV1', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { name: /PLA White/i })).toBeVisible({
      timeout: 15000,
    })
    await page.getByTestId('inventory-lot-tx-L1').click()
    await expect(page).toHaveURL(/\/transactions\/T11/)
    await expect(page.getByRole('heading', { name: /PLA White/i })).toBeVisible({
      timeout: 15000,
    })
  })

  test('shows mismatch warning when amount disagrees with lot sum', async ({ page }) => {
    await page.goto('/transactions/T11', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { name: /PLA White/i })).toBeVisible({
      timeout: 15000,
    })
    await page.getByTestId('expense-detail-amount-input').fill('-1')
    await expect(page.getByTestId('expense-detail-lot-sum-mismatch')).toBeVisible()
    await page.getByTestId('expense-detail-amount-input').fill('-29.99')
    await expect(page.getByTestId('expense-detail-lot-sum-mismatch')).not.toBeVisible()
  })

  test('save disabled when lot amounts disagree with expense total; save after fix', async ({
    page,
  }) => {
    await page.goto('/transactions/T11', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { name: /PLA White/i })).toBeVisible({
      timeout: 15000,
    })
    await page.getByTestId('expense-detail-lot-amount-input-L1').fill('1')
    await expect(page.getByTestId('expense-detail-lot-sum-mismatch')).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByTestId('expense-detail-save-changes')).toBeDisabled()
    await page.getByTestId('expense-detail-lot-amount-input-L1').fill('29.99')
    await expect(page.getByTestId('expense-detail-lot-sum-mismatch')).not.toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByTestId('expense-detail-save-changes')).toBeEnabled()
    await page.getByTestId('expense-detail-save-changes').click()
    await expect(page.getByTestId('expense-detail-save-changes')).toBeEnabled({
      timeout: 15000,
    })
  })

  test('income transaction id shows not found on detail route', async ({ page }) => {
    await page.goto('/transactions/t1', { waitUntil: 'load' })
    await expect(
      page.getByText(/could not be found|not an expense|no se encontró|no es un gasto/i),
    ).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByRole('link', { name: /back to transactions|volver a transacciones/i }),
    ).toBeVisible()
  })
})
