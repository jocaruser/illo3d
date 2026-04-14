import { test, expect } from './fixtures'

test.describe('Job pieces (job detail)', () => {
  test('unauthenticated user is redirected from /jobs/J1 to /login', async ({
    page,
  }) => {
    await page.goto('/jobs/J1', { waitUntil: 'load' })
    await expect(page).toHaveURL(/\/login/)
  })

  test('pieces table shows fixture data and expandable lines', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page).toHaveURL(/\/jobs/)
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await expect(page.getByText('Phone case prototype')).toBeVisible({
      timeout: 10000,
    })
    await expect(
      page.getByRole('heading', { name: /pieces|piezas/i })
    ).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Phone case top shell')).toBeVisible()

    await page.getByTestId('expand-piece-P1').click()
    await expect(page.getByText('42')).toBeVisible()
    await expect(page.getByText(/PLA White|INV1/)).toBeVisible()
  })

  test('create piece appends row', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await page.getByTestId('add-piece-button').click()
    await expect(
      page.getByRole('heading', { name: /create piece|crear pieza/i })
    ).toBeVisible()

    await expect(
      page.getByPlaceholder(/search jobs|buscar trabajos/i)
    ).toHaveCount(0)

    await page.getByPlaceholder(/e.g. top shell|carcasa superior/i).fill('e2e piece marker')

    await page.getByRole('button', { name: /create piece|crear pieza/i }).click()

    await expect(page.getByText('e2e piece marker')).toBeVisible({
      timeout: 20000,
    })
  })

  test('create piece item appends line', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await page.getByTestId('expand-piece-P2').click()
    await page.getByTestId('add-line-P2').click()

    await expect(
      page.getByRole('heading', { name: /add material line|añadir línea de material/i })
    ).toBeVisible()

    await page.getByLabel(/quantity|cantidad/i).fill('7')

    await page.getByRole('button', { name: /add line|añadir línea/i }).click()

    await expect(page.getByRole('heading', { name: /add material line|añadir línea de material/i })).not.toBeVisible({
      timeout: 15000,
    })
    const p2Detail = page.locator('#piece-items-P2')
    await expect(p2Detail.getByText('7', { exact: true })).toBeVisible({
      timeout: 15000,
    })
  })

  test('mark piece done shows decrement checkbox and updates status', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await page.getByTestId('piece-status-P2').selectOption('done')
    await expect(
      page.getByRole('heading', { name: /complete piece|completar pieza/i })
    ).toBeVisible()
    const decrementBox = page.getByRole('checkbox', {
      name: /decrement|descontar/i,
    })
    await expect(decrementBox).toBeChecked()
    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(
      page.getByRole('heading', { name: /complete piece|completar pieza/i })
    ).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('piece-status-P2')).toHaveValue('done')
  })

  test('revert piece to pending shows restore checkbox', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await page.getByTestId('piece-status-P2').selectOption('done')
    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(page.getByTestId('piece-status-P2')).toHaveValue('done', {
      timeout: 15000,
    })

    await page.getByTestId('piece-status-P2').selectOption('pending')
    await expect(
      page.getByRole('heading', { name: /revert piece|revertir estado/i })
    ).toBeVisible()
    const restoreBox = page.getByRole('checkbox', {
      name: /restore|restaurar/i,
    })
    await expect(restoreBox).toBeChecked()
    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(
      page.getByRole('heading', { name: /revert piece|revertir estado/i })
    ).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('piece-status-P2')).toHaveValue('pending')
  })

  test('skip inventory decrement via checkbox still completes piece', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await page.getByTestId('piece-status-P1').selectOption('done')
    await page
      .getByRole('checkbox', { name: /decrement|descontar/i })
      .setChecked(false)
    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(page.getByTestId('piece-status-P1')).toHaveValue('done', {
      timeout: 15000,
    })
  })

  test('cannot mark done without material lines', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await page.getByTestId('add-piece-button').click()
    await page.getByPlaceholder(/e.g. top shell|carcasa superior/i).fill('no-lines-piece')
    await page.getByRole('button', { name: /create piece|crear pieza/i }).click()
    await expect(page.getByText('no-lines-piece')).toBeVisible({
      timeout: 20000,
    })

    const newPieceRow = page
      .locator('tbody tr')
      .filter({ has: page.getByText('no-lines-piece') })
      .first()
    const statusSelect = newPieceRow.locator('[data-testid^="piece-status-"]')
    await statusSelect.selectOption('done')
    await expect(
      page.getByRole('alert').filter({
        hasText: /at least one material|al menos una línea de material/i,
      })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /complete piece|completar pieza/i })
    ).toHaveCount(0)
  })

  test('add line lot picker shows remaining quantity', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await page.getByTestId('expand-piece-P1').click()
    await page.getByTestId('add-line-P1').click()
    const select = page.locator('#piece-item-inventory')
    await expect(select.locator('option').nth(1)).toContainText(/\d/)
  })
})
