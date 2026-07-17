import { test, expect } from './fixtures'

test.describe('Dashboard', () => {
  test('landing page shows kanban, balance stat, and dashboard nav active', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 10000,
    })

    await expect(
      page.getByRole('heading', { name: /jobs|trabajos/i }).first(),
    ).toBeVisible()

    await expect(page.getByRole('heading', { name: /draft|borrador/i })).toBeVisible()

    await expect(page.locator('a[href="#/transactions"]').first()).toBeVisible()

    await expect(
      page.getByRole('heading', { name: /recent transactions|transacciones recientes/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /recent spending|gastos recientes/i }),
    ).toHaveCount(0)

    const jobConceptLink = page.getByTestId('transaction-concept-job-link-T13')
    await expect(jobConceptLink).toBeVisible()
    await jobConceptLink.click()
    await expect(page).toHaveURL(/\/jobs\/J4/)

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

  test('save button opens the preview and Save all triggers success toast', async ({
    page,
    openCsvShop,
  }) => {
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

    // Save opens the preview; Save all writes and toasts
    await page.getByTestId('workbook-save').click()
    await expect(page).toHaveURL(/\/save/)
    await expect(page.getByTestId('save-preview-page')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('save-preview-save-all').click()

    await expect(
      page.locator('[data-sonner-toast]').getByText(/saved|guardado/i),
    ).toBeVisible({ timeout: 10000 })
  })

  test('save preview blocks nothing and Save all completes the write', async ({
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

    // Save opens the preview; Save all runs the write on the preview's own cards
    await page.getByTestId('workbook-save').click()
    await expect(page.getByTestId('save-preview-page')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('save-preview-save-all').click()

    // Verify save completes and toast appears
    await expect(
      page.locator('[data-sonner-toast]').getByText(/saved|guardado/i),
    ).toBeVisible({ timeout: 10000 })

    // No blocking overlay is left behind
    await expect(page.getByTestId('blocking-overlay')).not.toBeVisible({ timeout: 5000 })
  })
})
