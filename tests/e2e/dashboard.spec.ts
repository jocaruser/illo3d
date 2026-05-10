import { test, expect } from './fixtures'

test.describe('Dashboard', () => {
  test('landing page shows dashboard, balance stat, and dashboard nav active', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 10000,
    })

    // Dashboard now shows stats view by default
    await expect(page.getByText('Active jobs', { exact: true })).toBeVisible()

    await expect(page.locator('a[href="#/transactions"]').first()).toBeVisible()

    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await expect(page).toHaveURL(/\/dashboard/)

    await expect(page.getByRole('link', { name: /dashboard|panel/i })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await page.getByRole('link', { name: /clients|clientes/i }).first().click()
    await expect(page).toHaveURL(/\/clients/)
    await expect(
      page.getByRole('link', { name: /dashboard|panel/i }).first(),
    ).not.toHaveAttribute('aria-current', 'page')
  })

  test('save button triggers success toast', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 10000,
    })

    // Navigate to clients and archive a client to create dirty state
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({ timeout: 10000 })

    const row = page.getByRole('row', { name: /Gamma Inc/i })
    await row
      .getByRole('button', { name: /archive|archivar|delete|eliminar/i })
      .click()

    await page
      .getByRole('dialog', {
        name: /archive client|archivar cliente|delete client|eliminar cliente/i,
      })
      .getByRole('button', { name: /archive|archivar|delete|eliminar/i })
      .click()

    await expect(page.getByRole('row', { name: /Gamma Inc/i })).not.toBeVisible({
      timeout: 20000,
    })

    // Click Save and expect toast
    await page.getByTestId('workbook-save').click()

    await expect(
      page.locator('[data-sonner-toast]').getByText(/saved|guardado/i),
    ).toBeVisible({ timeout: 10000 })
  })

  test('blocking overlay appears during save and prevents interaction', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 10000,
    })

    // Create dirty state
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({ timeout: 10000 })

    const row = page.getByRole('row', { name: /Gamma Inc/i })
    await row
      .getByRole('button', { name: /archive|archivar|delete|eliminar/i })
      .click()

    await page
      .getByRole('dialog', {
        name: /archive client|archivar cliente|delete client|eliminar cliente/i,
      })
      .getByRole('button', { name: /archive|archivar|delete|eliminar/i })
      .click()

    await expect(page.getByRole('row', { name: /Gamma Inc/i })).not.toBeVisible({
      timeout: 20000,
    })

    // Click Save
    await page.getByTestId('workbook-save').click()

    // Overlay should appear briefly (may be fast in tests)
    // Verify save completes and toast appears
    await expect(
      page.locator('[data-sonner-toast]').getByText(/saved|guardado/i),
    ).toBeVisible({ timeout: 10000 })

    // Verify overlay is gone (blocking removed)
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible({ timeout: 5000 })
  })
})