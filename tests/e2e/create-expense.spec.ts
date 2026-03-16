import { test, expect } from '@playwright/test'

async function devLoginAndOpenShop(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'networkidle' })

  const devLoginButton = page.getByTestId('dev-login-button')
  await expect(devLoginButton).toBeVisible({ timeout: 15000 })
  await devLoginButton.click()

  await expect(page).toHaveURL(/\/transactions/)

  const openExistingButton = page.getByRole('button', {
    name: /open existing folder|abrir carpeta existente/i,
  })
  if (await openExistingButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await openExistingButton.click()
    await page.getByPlaceholder(/happy-path|missingcolumn/i).fill('happy-path')
    await page.getByRole('button', { name: /^open$/i }).click()
  }
}

test.describe('Create expense flow', () => {
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
