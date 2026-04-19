import { test, expect } from './fixtures'

test.describe('Jobs page', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('user without shop sees setup wizard on /jobs', async ({ page }) => {
      await page.goto('/jobs', { waitUntil: 'load' })
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

    const link = page.getByTestId('job-detail-link-J1')
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
    await page.getByRole('button', { name: 'Beta LLC' }).click()
    await page.getByPlaceholder(/what are you printing|qué vas a imprimir/i).fill('e2e job marker')

    await page.getByRole('button', { name: /create job|crear trabajo/i }).click()

    await expect(page.getByText('e2e job marker')).toBeVisible({ timeout: 20000 })
  })

  test('draft to in_progress updates status in workbook', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    const j1Status = page.locator('#job-status-J1')
    await j1Status.selectOption('in_progress')
    await expect(j1Status).toHaveValue('in_progress')
  })

  test('marking in_progress job paid with income checkbox unchecked skips transaction append', async ({
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

    const j2Status = page.locator('#job-status-J2')
    await j2Status.selectOption('paid')
    // Paid is dialog-gated: controlled select stays on prior value until confirm.
    await expect(j2Status).toHaveValue('in_progress')

    await expect(
      page.getByRole('heading', { name: /mark job as paid|marcar como pagado/i })
    ).toBeVisible({ timeout: 5000 })

    await expect(
      page.getByRole('dialog').getByText(/€42[.,]00/)
    ).toBeVisible()

    await page
      .getByRole('checkbox', {
        name: /create income transaction|crear un ingreso/i,
      })
      .uncheck()

    await page.getByRole('button', { name: /confirm|confirmar/i }).click()

    await expect(
      page.getByRole('heading', { name: /mark job as paid|marcar como pagado/i })
    ).not.toBeVisible({ timeout: 10000 })

    expect(appendPayloads.filter((p) => p.sheetName === 'transactions')).toHaveLength(0)
    await expect(j2Status).toHaveValue('paid', { timeout: 15000 })
  })

  test('marking delivered job paid shows confirmation and adds income transaction', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    const row = page.getByRole('row').filter({ hasText: 'Desk organizer' })
    const deskStatus = row.locator('select')
    await deskStatus.selectOption('paid')
    await expect(deskStatus).toHaveValue('delivered')

    await expect(
      page.getByRole('heading', { name: /mark job as paid|marcar como pagado/i })
    ).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: /confirm|confirmar/i }).click()

    await expect(deskStatus).toHaveValue('paid', { timeout: 15000 })

    await page.getByRole('link', { name: /transactions|transacciones/i }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })
    const incomeRow = page
      .getByRole('row')
      .filter({ hasText: /35[.,]50/ })
      .filter({ hasText: /income|ingreso/i })
    await expect(incomeRow.first()).toBeVisible({ timeout: 15000 })
  })

  test('marking draft job paid is blocked until every piece has a price', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    const j1PaidFlow = page.locator('#job-status-J1')
    await j1PaidFlow.selectOption('paid')
    await expect(j1PaidFlow).toHaveValue('draft')

    await expect(page.getByRole('alert')).toContainText(
      /per-unit price and a units count|precio por unidad y la cantidad de unidades/i,
    )

    await expect(
      page.getByRole('heading', { name: /mark job as paid|marcar como pagado/i })
    ).toHaveCount(0)
  })

  test('leaving paid status shows confirmation about duplicate transactions', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    const row = page.getByRole('row').filter({ hasText: 'Logo keychain batch' })
    const logoStatus = row.locator('select')
    await logoStatus.selectOption('delivered')
    await expect(logoStatus).toHaveValue('paid')

    await expect(
      page.getByRole('heading', {
        name: /change status from paid|cambiar el estado de pagado/i,
      })
    ).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: /confirm|confirmar/i }).click()

    await expect(
      page.getByRole('heading', {
        name: /change status from paid|cambiar el estado de pagado/i,
      })
    ).not.toBeVisible({ timeout: 10000 })

    await expect(logoStatus).toHaveValue('delivered', { timeout: 15000 })
  })

  test('marking job cancelled shows confirmation', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    const row = page.getByRole('row').filter({ hasText: 'Replacement gear' })
    const gearStatus = row.locator('select')
    await gearStatus.selectOption('cancelled')
    await expect(gearStatus).toHaveValue('in_progress')

    await expect(
      page.getByRole('heading', { name: /cancel job|cancelar trabajo/i })
    ).toBeVisible({ timeout: 5000 })

    await page.getByRole('button', { name: /confirm|confirmar/i }).click()

    await expect(
      page.getByRole('heading', { name: /cancel job|cancelar trabajo/i })
    ).not.toBeVisible({ timeout: 10000 })

    await expect(gearStatus).toHaveValue('cancelled', { timeout: 15000 })
  })
  })
})
