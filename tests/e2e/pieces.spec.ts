import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

async function commitPieceUnits(page: Page, pieceId: string, units: string) {
  const input = page.getByTestId(`piece-units-${pieceId}`)
  await input.fill(units)
  await input.blur()
  await expect(page.getByTestId(`piece-units-${pieceId}`)).toHaveValue(units, {
    timeout: 15000,
  })
}

test.describe('Job pieces (job detail)', () => {
  test.describe('unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('user without shop sees setup wizard on job detail', async ({ page }) => {
      await page.goto('/#/jobs/J1', { waitUntil: 'load' })
      await expect(page).toHaveURL(/\/jobs\/J1/)
      await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    })
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

    await expect(
      page.getByText('J1 — Phone case prototype'),
    ).toBeVisible({
      timeout: 10000,
    })
    await expect(
      page.getByRole('heading', { name: /pieces|piezas/i })
    ).toBeVisible()
    await expect(page.getByRole('table').filter({ hasText: /Expand/ })).toBeVisible({ timeout: 15000 })
    const piecesTable = page.getByRole('table').filter({ hasText: /Expand/ })
    await expect(piecesTable.getByText('Phone case top shell')).toBeVisible()
    await expect(page.getByTestId('piece-units-P1')).toBeVisible()

    await page.getByTestId('expand-piece-P1').click()
    await expect(
      page.locator('#piece-items-P1').getByRole('cell', { name: '42', exact: true })
    ).toBeVisible()
    await expect(page.locator('#piece-items-P1').getByRole('combobox').first()).toHaveValue('PLA White')
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

    const p2Detail = page.locator('#piece-items-P2')
    await expect(p2Detail.getByRole('combobox')).toHaveCount(2, { timeout: 10000 })

    const combobox = p2Detail.getByRole('combobox').last()
    await combobox.fill('Ender')
    await page.waitForSelector('.cursor-pointer', { timeout: 5000 })
    await page.locator('.cursor-pointer').first().click()

    await expect(combobox).toHaveValue('Ender 3', { timeout: 10000 })

    const qtyInput = p2Detail.locator('input[type="number"]').last()
    await qtyInput.fill('7')
    await qtyInput.blur()

    await expect(qtyInput).toHaveValue('7', {
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

    await commitPieceUnits(page, 'P2', '1')
    await page.getByTestId('piece-status-P2').focus()
    await page.getByRole('option', { name: /^done$/i }).click()
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
    await expect(page.getByTestId('piece-status-P2')).toHaveValue(/^done$/i)
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

    await commitPieceUnits(page, 'P2', '1')
    await page.getByTestId('piece-status-P2').focus()
    await page.getByRole('option', { name: /^done$/i }).click()
    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(page.getByTestId('piece-status-P2')).toHaveValue(/^done$/i, {
      timeout: 15000,
    })

    await page.getByTestId('piece-status-P2').focus()
    await page.getByRole('option', { name: /^pending$/i }).click()
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
    await expect(page.getByTestId('piece-status-P2')).toHaveValue(/^pending$/i)
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

    await commitPieceUnits(page, 'P1', '1')
    await page.getByTestId('piece-status-P1').focus()
    await page.getByRole('option', { name: /^done$/i }).click()
    await page
      .getByRole('checkbox', { name: /decrement|descontar/i })
      .setChecked(false)
    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(page.getByTestId('piece-status-P1')).toHaveValue(/^done$/i, {
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
    await statusSelect.focus()
    await page.getByRole('option', { name: /^done$/i }).click()
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

    const p1Detail = page.locator('#piece-items-P1')
    await expect(p1Detail.getByRole('combobox')).toHaveCount(2, { timeout: 10000 })

    const combobox = p1Detail.getByRole('combobox').last()
    await combobox.fill('PLA')
    await expect(combobox).toHaveAttribute('aria-expanded', 'true', { timeout: 5000 })
    await page.waitForSelector('.cursor-pointer', { timeout: 5000 })
    await page.locator('.cursor-pointer').first().click()
  })

  test('add line modal starts with dropdown empty', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await page.getByTestId('expand-piece-P1').click()
    await page.getByTestId('add-line-P1').click()

    const p1Detail = page.locator('#piece-items-P1')
    await expect(p1Detail.getByRole('combobox')).toHaveCount(2, { timeout: 10000 })

    const combobox = p1Detail.getByRole('combobox').last()
    await expect(combobox).toHaveValue('', { timeout: 5000 })
  })

  test('clearing combobox input stays empty', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await page.getByTestId('expand-piece-P1').click()
    await page.getByTestId('add-line-P1').click()

    const p1Detail = page.locator('#piece-items-P1')
    await expect(p1Detail.getByRole('combobox')).toHaveCount(2, { timeout: 10000 })

    const combobox = p1Detail.getByRole('combobox').last()
    await combobox.fill('PLA')
    await expect(combobox).toHaveAttribute('aria-expanded', 'true', { timeout: 5000 })
    await expect(combobox).toHaveValue('PLA')

    await combobox.fill('')
    await expect(combobox).toHaveValue('', { timeout: 5000 })
  })

  test('piece table offers BOM-based suggested price per piece', async ({
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

    const apply = page.getByTestId('piece-suggested-P1')
    await expect(apply).toBeVisible({ timeout: 10000 })
    await expect(apply).toHaveText(/€3[.,]78/)

    await apply.click()
    await expect(page.getByTestId('piece-price-P1')).toHaveValue('3.78', {
      timeout: 10000,
    })
  })

  test('create job from list has no suggested price control', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('add-job-button').click()
    await expect(
      page.getByRole('heading', { name: /create job|crear trabajo/i })
    ).toBeVisible()

    await expect(page.getByTestId('job-suggested-price-apply')).toHaveCount(0)
  })

  test('job detail shows widget grid with material cost in red', async ({
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

    const materialCostWidget = page.locator('[data-testid="job-widget-material-cost"]')
    await expect(materialCostWidget).toBeVisible({ timeout: 15000 })
    await expect(materialCostWidget.locator('.text-danger')).toBeVisible()
  })

  test('job detail shows risk factor widget', async ({
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

    await expect(page.locator('[data-testid="job-widget-risk-factor"]')).toBeVisible({ timeout: 15000 })
  })

  test('materials summary shows remaining qty column', async ({
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

    // Set units for P2 so the piece can use materials
    await page.getByTestId('expand-piece-P2').click()
    const unitsInput = page.getByTestId('piece-units-P2')
    await unitsInput.fill('1')
    await unitsInput.blur()
    await expect(unitsInput).toHaveValue('1', { timeout: 15000 })

    // Add a piece item with inventory
    await page.getByTestId('add-line-P2').click()
    const p2Detail = page.locator('#piece-items-P2')
    await expect(p2Detail.getByRole('combobox')).toHaveCount(2, { timeout: 10000 })

    // Select an inventory item
    const combobox = p2Detail.getByRole('combobox').last()
    await combobox.fill('PLA')
    await page.waitForSelector('.cursor-pointer', { timeout: 5000 })
    await page.locator('.cursor-pointer').first().click()

    // Set quantity
    const qtyInput = p2Detail.locator('input[type="number"]').last()
    await qtyInput.fill('2')
    await qtyInput.blur()

    // Now check for the Materials summary and Remaining column
    await expect(page.getByText('Materials summary')).toBeVisible()
    await expect(page.getByText('Remaining')).toBeVisible({ timeout: 15000 })
  })
})
