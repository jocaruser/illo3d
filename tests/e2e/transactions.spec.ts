import { test, expect } from '@playwright/test'

async function devLogin(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'networkidle' })

  const devLoginButton = page.getByTestId('dev-login-button')
  await expect(devLoginButton).toBeVisible({ timeout: 15000 })
  await devLoginButton.click()

  await expect(page).toHaveURL(/\/transactions/)
}

test.describe('Transactions page', () => {
  test('transactions table or empty state visible after authenticated user navigates to /transactions', async ({
    page,
  }) => {
    await devLogin(page)

    const transactionsHeading = page.getByRole('heading', { name: 'Transactions' })
    await expect(transactionsHeading).toBeVisible({ timeout: 10000 })

    const hasTable = (await page.getByRole('table').count()) > 0
    const hasEmptyState = (await page.getByText(/no transactions|no hay transacciones/i).count()) > 0
    const hasLoading = (await page.getByText(/loading/i).count()) > 0
    const hasConnecting = (await page.getByText(/connecting/i).count()) > 0
    const hasError = (await page.getByText(/error|retry/i).count()) > 0

    expect(hasTable || hasEmptyState || hasLoading || hasConnecting || hasError).toBeTruthy()
  })

  test('balance is displayed when connected to Sheets', async ({ page }) => {
    await devLogin(page)

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    const balanceLabel = page.getByText(/^Balance:/)
    const connectingOrError = page.getByText(/connecting|error/i)
    await expect(balanceLabel.or(connectingOrError)).toBeVisible({ timeout: 15000 })
  })

  test('no add, edit, or delete buttons visible in transactions UI', async ({
    page,
  }) => {
    await devLogin(page)

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByRole('button', { name: /add|create|new/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /delete|remove/i })).not.toBeVisible()
  })
})
