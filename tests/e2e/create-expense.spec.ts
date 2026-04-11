import { test, expect } from '@playwright/test'

async function devLoginAndOpenShop(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'networkidle' })

  const devLoginButton = page.getByTestId('dev-login-button')
  await expect(devLoginButton).toBeVisible({ timeout: 15000 })
  await devLoginButton.click()

  await expect(page).toHaveURL(/\/transactions/)

  const openExistingButton = page.getByRole('button', {
    name: /open existing shop|abrir tienda existente/i,
  })
  if (await openExistingButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByRole('button', { name: /local csv|csv local/i }).first().click()
    await openExistingButton.first().click()
    await page.getByRole('button', { name: /open existing shop|abrir tienda existente/i }).first().click()
  }
}

test.describe('Create expense flow', () => {
  test.describe.configure({ mode: 'serial' })
  test('Add expense button opens popup from transactions page', async ({
    page,
  }) => {
    await devLoginAndOpenShop(page)

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

  test('create expense with inventory sends inventory append request', async ({
    page,
  }) => {
    const appendPayloads: { sheetName?: string; rows?: unknown[] }[] = []
    page.on('request', (req) => {
      if (req.method() !== 'POST' || !req.url().includes('/api/sheets/append')) {
        return
      }
      const raw = req.postData()
      if (!raw) return
      try {
        appendPayloads.push(JSON.parse(raw) as { sheetName?: string; rows?: unknown[] })
      } catch {
        /* ignore */
      }
    })

    await devLoginAndOpenShop(page)

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/^Balance:/).or(page.getByText(/connecting/i))).toBeVisible({
      timeout: 15000,
    })

    await page.getByRole('button', { name: /add expense|añadir gasto/i }).click()

    await page.getByLabel(/date|fecha/i).fill('2025-04-01')
    await page.getByLabel(/amount|importe/i).fill('19.99')
    await page.getByLabel(/notes|notas/i).fill('e2e filament marker')

    await page
      .getByRole('checkbox', { name: /add to inventory|añadir al inventario/i })
      .check()

    await page
      .getByLabel(/inventory name|nombre en inventario/i)
      .fill('e2e filament marker')

    await page.locator('#expense-inventory-quantity').fill('500')

    await page.getByRole('button', { name: /create expense|crear gasto/i }).click()

    await expect(page).toHaveURL(/\/expenses/, { timeout: 20000 })

    const inventoryAppends = appendPayloads.filter((p) => p.sheetName === 'inventory')
    expect(inventoryAppends.length).toBeGreaterThanOrEqual(1)
    const row = inventoryAppends[inventoryAppends.length - 1].rows?.[0] as Record<
      string,
      unknown
    >
    expect(row?.type).toBe('filament')
    expect(row?.name).toBe('e2e filament marker')
    expect(row?.qty_initial).toBe(500)
  })

  test('create expense without inventory does not append inventory sheet', async ({
    page,
  }) => {
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

    await devLoginAndOpenShop(page)

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/^Balance:/).or(page.getByText(/connecting/i))).toBeVisible({
      timeout: 15000,
    })

    await page.getByRole('button', { name: /add expense|añadir gasto/i }).click()

    await page.getByLabel(/date|fecha/i).fill('2025-04-02')
    await page.getByLabel(/amount|importe/i).fill('12.00')

    await page.getByRole('button', { name: /create expense|crear gasto/i }).click()

    await expect(page).toHaveURL(/\/expenses/, { timeout: 20000 })

    expect(appendPayloads.filter((p) => p.sheetName === 'inventory')).toHaveLength(0)
  })

  test('create expense and redirect to expenses page', async ({ page }) => {
    await devLoginAndOpenShop(page)

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

    const dateInput = page.getByLabel(/date|fecha/i)
    await expect(dateInput).toBeVisible({ timeout: 5000 })
    await dateInput.fill('2025-03-20')

    const amountInput = page.getByLabel(/amount|importe/i)
    await amountInput.fill('25.50')

    const submitButton = page.getByRole('button', {
      name: /create expense|crear gasto/i,
    })
    await submitButton.click()

    await expect(page).toHaveURL(/\/expenses/, { timeout: 20000 })
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible()
  })
})
