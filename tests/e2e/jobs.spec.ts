import { test, expect } from './fixtures'

test.describe('Jobs page', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('user without shop sees setup wizard on /jobs', async ({ page }) => {
      await page.goto('/#/jobs', { waitUntil: 'load' })
      await expect(page).toHaveURL(/\/jobs/)
      await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('authenticated', () => {
    test.describe.configure({ mode: 'serial' })

    test('jobs table shows fixture data after navigation', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page).toHaveURL(/\/jobs/)

    await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Phone case prototype')).toBeVisible()
  })

  test('job id link shows tag tooltip on hover', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    const link = page.getByTestId('job-description-tooltip-J1')
    await expect(link).toBeVisible({ timeout: 15000 })
    await link.hover()

    const tip = page.getByRole('tooltip')
    await expect(tip).toBeVisible()
    await expect(tip).toContainText(/Vip/i)
  })

  test('create job adds a row to the table', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    await page.getByTestId('add-job-button').click()
    await expect(page.getByRole('heading', { name: /create job|crear trabajo/i })).toBeVisible()

    await page.getByPlaceholder(/search clients|buscar clientes/i).fill('Beta')
    await page.getByRole('option', { name: 'Beta LLC' }).click()
    await page.getByPlaceholder(/what are you printing|qué vas a imprimir/i).fill('e2e job marker')

    // Wait for navigation to complete after creating
    await Promise.all([
      page.waitForURL(/\/jobs\/J\d+/, { timeout: 20000 }),
      page.getByRole('button', { name: /create job|crear trabajo/i }).click(),
    ])

    await expect(page.getByText(/J\d+ — e2e job marker/)).toBeVisible({ timeout: 20000 })
  })

  test('completing a job shows confirmation dialog and creates income transaction', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    // Navigate to a job detail page to complete it
    await page.getByTestId('job-detail-link-J2').click()
    await expect(page).toHaveURL(/\/jobs\/J2/)
    
    // Click complete button
    await page.getByRole('button', { name: /complete|completar/i }).click()
    
    // Confirmation dialog should appear (using i18n key since E2E mocks translations)
    const confirmDialog = page.getByRole('dialog', { name: /jobs\.completeConfirmTitle/i })
    await expect(confirmDialog).toBeVisible({ timeout: 5000 })

    // Confirm completion
    await confirmDialog.getByRole('button', { name: /jobs\.complete/i }).click()

    // Should show completed status
    await expect(page.getByText(/completed|completado/i)).toBeVisible({ timeout: 15000 })
  })

  test('completing a job without income checkbox skips transaction', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
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
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    // Navigate to J1 which has incomplete pricing - first need to add pricing
    // Actually use J2 which already has complete pricing
    await page.getByTestId('job-detail-link-J2').click()
    await expect(page).toHaveURL(/\/jobs\/J2/)
    
    // Click complete button
    await page.getByRole('button', { name: /complete|completar/i }).click()
    
    // Confirmation dialog should appear
    const confirmDialog = page.getByRole('dialog', { name: /jobs\.completeConfirmTitle/i })
    await expect(confirmDialog).toBeVisible({ timeout: 5000 })

    // Uncheck income transaction checkbox
    await confirmDialog
      .getByRole('checkbox', {
        name: /jobs\.createIncomeTransaction|create income/i,
      })
      .uncheck()

    await confirmDialog.getByRole('button', { name: /jobs\.complete/i }).click()

    await expect(
      page.getByRole('dialog', { name: /jobs\.completeConfirmTitle/i })
    ).not.toBeVisible({ timeout: 10000 })

    expect(appendPayloads.filter((p) => p.sheetName === 'transactions')).toHaveLength(0)
    await expect(page.getByText(/completed|completado/i)).toBeVisible({ timeout: 15000 })
  })
  })
})