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

  test('inventory name links to detail page', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 10000,
    })
    await page.getByRole('link', { name: 'Inventory', exact: true }).first().click()
    await expect(page).toHaveURL(/\/inventory/)
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    await page.getByTestId('inventory-table-link-INV1').click()
    await expect(page).toHaveURL(/\/inventory\/INV1/)
    await expect(page.getByRole('heading', { name: 'PLA White' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByRole('heading', { name: 'Purchase lots' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Consumption' })).toBeVisible()
  })

  test('unknown inventory id shows not found', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.goto('/inventory/NOT-A-REAL-ID')
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/no inventory item/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /back to inventory|volver al inventario/i })).toBeVisible()
  })

  test('lot-backed expense transaction links concept to expense detail', async ({
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
    const link = page.getByTestId('transaction-concept-expense-detail-link-T11')
    await expect(link).toBeVisible({ timeout: 15000 })
    await expect(link).toHaveText(/PLA White/i)
    await link.click()
    await expect(page).toHaveURL(/\/transactions\/T11/)
    await expect(page.getByRole('heading', { name: /PLA White/i })).toBeVisible({
      timeout: 10000,
    })
    await expect(
      page.getByRole('heading', { name: /linked lots|lotes vinculados/i }),
    ).toBeVisible()
  })

  test('saving thresholds on inventory detail', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.goto('/inventory/INV2')
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: /Ender 3/i })).toBeVisible({
      timeout: 10000,
    })

    await page.getByTestId('inventory-detail-warn-yellow').fill('10')
    await page.getByTestId('inventory-detail-warn-orange').fill('5')
    await page.getByTestId('inventory-detail-warn-red').fill('1')
    await page.getByTestId('inventory-detail-save-thresholds').click()
    await expect(page.getByTestId('inventory-detail-warn-yellow')).toHaveValue('10')

    await page.getByRole('link', { name: 'Inventory', exact: true }).first().click()
    await expect(page).toHaveURL(/\/inventory$/)
    await page.getByTestId('inventory-table-link-INV2').click()
    await expect(page).toHaveURL(/\/inventory\/INV2/)
    await expect(page.getByTestId('inventory-detail-warn-yellow')).toHaveValue('10')
  })
})
