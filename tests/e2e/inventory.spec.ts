import { test, expect } from './fixtures'

test.describe('Inventory page', () => {
  test('inventory table visible after navigating from header', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

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

  test('expense row shows inventory link when linked', async ({ page, openCsvShop }) => {
    void openCsvShop

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
