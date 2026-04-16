import { test, expect } from './fixtures'

test.describe('Create expense flow', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.goto('/transactions', { waitUntil: 'load' })
  })

  test('Add expense button opens popup from transactions page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/^Balance:/).or(page.getByText(/connecting/i))).toBeVisible({
      timeout: 15000,
    })

    const addExpenseButton = page.getByRole('button', {
      name: /add expense|añadir gasto/i,
    })
    await expect(addExpenseButton).toBeVisible({ timeout: 15000 })
    await addExpenseButton.click()

    await expect(page.getByText(/add expense|añadir gasto/i).first()).toBeVisible({
      timeout: 5000,
    })
  })

  test('create expense with inventory adds inventory row', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/^Balance:/).or(page.getByText(/connecting/i))).toBeVisible({
      timeout: 15000,
    })

    await page.getByRole('button', { name: /add expense|añadir gasto/i }).click()

    await page.locator('#expense-date').fill('2025-04-01')
    await page.locator('#expense-amount').fill('19.99')
    await page.locator('#expense-notes').fill('e2e filament marker')

    await page
      .getByRole('checkbox', { name: /add to inventory|añadir al inventario/i })
      .check()

    await page
      .getByLabel(/inventory name|nombre en inventario/i)
      .fill('e2e filament marker')

    await page.locator('#expense-inventory-quantity').fill('500')

    await page.getByRole('button', { name: /create expense|crear gasto/i }).click()

    await expect(page).toHaveURL(/\/expenses/, { timeout: 20000 })
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: '2025-04-01' })
        .filter({ hasText: /€19\.99/ })
        .filter({ hasText: 'e2e filament marker' })
    ).toBeVisible()

    await page.getByRole('link', { name: /inventory|inventario/i }).click()
    await expect(page.getByRole('heading', { name: /inventory|inventario/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('e2e filament marker')).toBeVisible({ timeout: 15000 })
  })

  test('create expense without inventory does not append inventory sheet', async ({ page }) => {
    const appendPayloads: { sheetName?: string }[] = []
    page.on('request', (req) => {
      if (req.method() !== 'POST' || !req.url().includes('/api/sheets/append')) {
        return
      }
      const raw = req.postData()
      if (!raw) return
      try {
        appendPayloads.push(JSON.parse(raw) as { sheetName?: string })
      } catch {
        /* ignore */
      }
    })

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/^Balance:/).or(page.getByText(/connecting/i))).toBeVisible({
      timeout: 15000,
    })

    await page.getByRole('button', { name: /add expense|añadir gasto/i }).click()

    await page.locator('#expense-date').fill('2025-04-02')
    await page.locator('#expense-amount').fill('12.00')
    await page.locator('#expense-notes').fill('e2e no inventory')

    await page.getByRole('button', { name: /create expense|crear gasto/i }).click()

    await expect(page).toHaveURL(/\/expenses/, { timeout: 20000 })
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: '2025-04-02' })
        .filter({ hasText: /€12\.00/ })
        .filter({ hasText: 'e2e no inventory' })
    ).toBeVisible()

    expect(appendPayloads.filter((p) => p.sheetName === 'inventory')).toHaveLength(0)
  })

  test('create expense and redirect to expenses page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/^Balance:/).or(page.getByText(/connecting/i))).toBeVisible({
      timeout: 15000,
    })

    const addExpenseButton = page.getByRole('button', {
      name: /add expense|añadir gasto/i,
    })
    await expect(addExpenseButton).toBeVisible({ timeout: 15000 })
    await addExpenseButton.click()

    const dateInput = page.locator('#expense-date')
    await expect(dateInput).toBeVisible({ timeout: 5000 })
    await dateInput.fill('2099-07-01')

    const amountInput = page.locator('#expense-amount')
    await amountInput.fill('25.50')
    await page.locator('#expense-notes').fill('e2e redirect row')

    const submitButton = page.getByRole('button', {
      name: /create expense|crear gasto/i,
    })
    await submitButton.click()

    await expect(page).toHaveURL(/\/expenses/, { timeout: 20000 })
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible()
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
