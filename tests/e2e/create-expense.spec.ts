import { test, expect } from './fixtures'
import { readMockCsv } from './helpers/readMockCsv'

test.describe('Record purchase flow', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page, openCsvShop }) => {
    void openCsvShop
    // Ensure clean state - reload page to clear any stuck dialogs/state
    await page.goto('/#/dashboard')
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 15000 })
    // Navigate to transactions
    await page.getByRole('link', { name: /transactions|transacciones/i }).first().click()
    await expect(page).toHaveURL(/\/transactions/)
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 15000 })
  })

  test('Record purchase button opens popup from transactions page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/^Balance:/).or(page.getByText(/connecting/i))).toBeVisible({
      timeout: 15000,
    })

    const btn = page.getByTestId('transactions-record-purchase')
    await expect(btn).toBeVisible({ timeout: 15000 })
    await btn.click()

    const dialog = page.getByTestId('purchase-dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(
      dialog.getByRole('heading', { name: /record purchase|registrar compra/i }),
    ).toBeVisible()
    // Close dialog to clean up for next test
    await page.getByRole('button', { name: /cancel|Cancel/i }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('purchase with inventory adds inventory row', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/^Balance:/).or(page.getByText(/connecting/i))).toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('transactions-record-purchase').click()
    await expect(page.getByTestId('purchase-dialog')).toBeVisible()

    await page.locator('#purchase-date').fill('2025-04-01')
    await page.locator('#purchase-notes').fill('e2e filament marker')

    await page
      .getByRole('checkbox', { name: /add to inventory|añadir al inventario/i })
      .check()

    await page.getByRole('button', { name: /new item|artículo nuevo/i }).click()

    await page.getByTestId('purchase-line-0-new-name').fill('e2e filament marker')
    await page.getByTestId('purchase-line-0-qty').fill('500')
    await page.getByTestId('purchase-line-0-amount').fill('19.99')

    // Wait for navigation to complete after creating
    await page.getByRole('button', { name: /save purchase|guardar compra/i }).click()

    await expect(page).toHaveURL(/\/transactions\/T\d+/, { timeout: 20000 })

    await expect(page.getByRole('heading', { name: 'e2e filament marker' })).toBeVisible({ timeout: 15000 })

    await page.getByTestId('entity-detail-back').click()
    await expect(page).toHaveURL(/\/transactions/, { timeout: 20000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: /e2e filament marker/ }),
    ).toBeVisible({ timeout: 15000 })

    await page.getByRole('link', { name: /inventory|inventario/i }).first().click()
    await expect(page.getByRole('heading', { name: /inventory|inventario/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('e2e filament marker')).toBeVisible({ timeout: 15000 })
  })

  test('overhead purchase does not add an inventory item', async ({ page, openCsvShop }) => {
    void openCsvShop
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/^Balance:/).or(page.getByText(/connecting/i))).toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('transactions-record-purchase').click()
    await expect(page.getByTestId('purchase-dialog')).toBeVisible()

    await page.locator('#purchase-date').fill('2025-04-02')
    await page.locator('#purchase-amount').fill('12.00')
    await page.locator('#purchase-notes').fill('e2e no inventory')

    // Wait for navigation to complete after creating
    await page.getByRole('button', { name: /save purchase|guardar compra/i }).click()
    await page.waitForURL(/\/transactions\/T\d+/, { timeout: 20000 })

    await expect(page.getByRole('heading', { name: 'e2e no inventory' })).toBeVisible({ timeout: 15000 })

    await page.getByTestId('entity-detail-back').click()
    await expect(page).toHaveURL(/\/transactions/, { timeout: 20000 })
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: '2025-04-02' })
        .filter({ hasText: /€12\.00/ })
        .filter({ hasText: 'e2e no inventory' }),
    ).toBeVisible()

    // Prove the negative on the real write surface: persist the workbook and
    // read the CSVs back. The expense must land in transactions.csv while
    // inventory.csv stays free of it (INV1 is the positive control that we
    // are reading the right file).
    await page.getByTestId('workbook-save').click()
    await expect(page.getByText(/workbook saved|libro guardado/i)).toBeVisible({
      timeout: 20000,
    })
    const transactionsCsv = await readMockCsv(page, 'transactions.csv')
    expect(transactionsCsv).toContain('e2e no inventory')
    const inventoryCsv = await readMockCsv(page, 'inventory.csv')
    expect(inventoryCsv).toContain('INV1')
    expect(inventoryCsv).not.toContain('e2e no inventory')
  })

  test('successful purchase navigates to transaction detail', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 15000,
    })

    await expect(page.getByText(/^Balance:/).or(page.getByText(/connecting/i))).toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('transactions-record-purchase').click()
    await expect(page.getByTestId('purchase-dialog')).toBeVisible()

    await page.locator('#purchase-date').fill('2099-07-01')
    await page.locator('#purchase-amount').fill('25.50')
    await page.locator('#purchase-notes').fill('e2e redirect row')

    // Wait for navigation to complete after creating
    await page.getByRole('button', { name: /save purchase|guardar compra/i }).click()
    await page.waitForURL(/\/transactions\/T\d+/, { timeout: 20000 })

    await expect(page.getByRole('heading', { name: 'e2e redirect row' })).toBeVisible({ timeout: 15000 })

    await page.getByTestId('entity-detail-back').click()
    await expect(page).toHaveURL(/\/transactions/, { timeout: 20000 })
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: '2099-07-01' })
        .filter({ hasText: /25[.,]50/ })
        .filter({ hasText: 'e2e redirect row' })
        .first(),
    ).toBeVisible()
  })
})
