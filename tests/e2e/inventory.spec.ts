import { test, expect } from './fixtures'

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

test.describe('Inventory page', () => {
  test('inventory table visible after navigating from header', async ({
    page,
  }) => {
    await devLoginAndOpenShop(page)

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await page.getByRole('link', { name: 'Inventory' }).click()
    await expect(page).toHaveURL(/\/inventory/)
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('PLA White')).toBeVisible()
  })

  test('expense row shows inventory link when linked', async ({ page }) => {
    await devLoginAndOpenShop(page)

    await page.getByRole('link', { name: 'Expenses' }).click()
    await expect(page).toHaveURL(/\/expenses/)
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    const rowWithPla = page.getByRole('row').filter({ hasText: 'PLA White' })
    await expect(
      rowWithPla.getByRole('link', { name: 'Inventory' })
    ).toBeVisible({ timeout: 15000 })
  })
})
