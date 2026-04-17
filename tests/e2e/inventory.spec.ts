import { test, expect } from './fixtures'

test.describe('Inventory page', () => {
  test('inventory table visible after navigating from header', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 10000,
    })

    await page
      .getByRole('link', { name: 'Inventory', exact: true })
      .first()
      .click()
    await expect(page).toHaveURL(/\/inventory/)
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('PLA White')).toBeVisible()
  })

  test('lot-backed expense transaction links concept to inventory', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await page.getByRole('link', { name: /transactions|transacciones/i }).click()
    await expect(page).toHaveURL(/\/transactions/)
    await expect(page.getByRole('heading', { name: /transactions|transacciones/i })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 15000 })
    const link = page.getByTestId('transaction-concept-inventory-link-T11')
    await expect(link).toBeVisible({ timeout: 15000 })
    await expect(link).toHaveText(/PLA White/i)
  })
})
