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

test.describe('Jobs page', () => {
  test.describe.configure({ mode: 'serial' })

  test('unauthenticated user is redirected from /jobs to /login', async ({
    page,
  }) => {
    await page.goto('/jobs', { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/\/login/)
  })

  test('jobs table shows fixture data after navigation', async ({ page }) => {
    await devLoginAndOpenShop(page)

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page).toHaveURL(/\/jobs/)

    await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Phone case prototype')).toBeVisible()
  })


  test('create job adds a row to the table', async ({ page }) => {
    await devLoginAndOpenShop(page)

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

  test('draft to in_progress sends row update', async ({ page }) => {
    const rowRequests: { method?: string; url?: string }[] = []
    page.on('request', (req) => {
      if (req.url().includes('/api/sheets/row')) {
        rowRequests.push({ method: req.method(), url: req.url() })
      }
    })

    await devLoginAndOpenShop(page)
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    const j1Status = page.locator('#job-status-J1')
    await j1Status.selectOption('in_progress')
    await expect(j1Status).toHaveValue('in_progress')

    await expect
      .poll(() => rowRequests.filter((r) => r.method === 'PUT').length)
      .toBeGreaterThan(0)

    await expect(j1Status).toHaveValue('in_progress')
  })

  test('marking in_progress job paid with income checkbox unchecked skips transaction append', async ({
    page,
  }) => {
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

    await devLoginAndOpenShop(page)
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    const j2Status = page.locator('#job-status-J2')
    await j2Status.selectOption('paid')
    // Paid is dialog-gated: controlled select stays on prior value until confirm.
    await expect(j2Status).toHaveValue('in_progress')

    await expect(
      page.getByRole('heading', { name: /mark job as paid|marcar como pagado/i })
    ).toBeVisible({ timeout: 5000 })

    await page.getByLabel(/price|precio/i).fill('42')

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

  test('marking delivered job paid shows confirmation and appends transaction', async ({
    page,
  }) => {
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

    await devLoginAndOpenShop(page)
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

    await expect
      .poll(() => appendPayloads.filter((p) => p.sheetName === 'transactions').length)
      .toBeGreaterThan(0)

    await expect(deskStatus).toHaveValue('paid', { timeout: 15000 })

    const txAppend = appendPayloads.filter((p) => p.sheetName === 'transactions')
    const lastTx = txAppend[txAppend.length - 1].rows?.[0] as Record<string, unknown>
    expect(lastTx?.type).toBe('income')
    expect(lastTx?.ref_type).toBe('job')
    expect(Number(lastTx?.amount)).toBe(35.5)
  })

  test('marking draft job paid without price requires price input', async ({
    page,
  }) => {
    await devLoginAndOpenShop(page)
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    const j1PaidFlow = page.locator('#job-status-J1')
    await j1PaidFlow.selectOption('paid')
    await expect(j1PaidFlow).toHaveValue('draft')

    await expect(page.getByLabel(/price|precio/i)).toBeVisible({ timeout: 5000 })
    await page.getByLabel(/price|precio/i).fill('9.99')

    await page.getByRole('button', { name: /confirm|confirmar/i }).click()

    await expect(
      page.getByRole('heading', { name: /mark job as paid|marcar como pagado/i })
    ).not.toBeVisible({
      timeout: 10000,
    })

    await expect(j1PaidFlow).toHaveValue('paid', { timeout: 15000 })
  })

  test('leaving paid status shows confirmation about duplicate transactions', async ({
    page,
  }) => {
    await devLoginAndOpenShop(page)
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

  test('marking job cancelled shows confirmation', async ({ page }) => {
    await devLoginAndOpenShop(page)
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
