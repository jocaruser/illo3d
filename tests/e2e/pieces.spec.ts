import { test, expect } from './fixtures'

test.describe('Job pieces (job detail)', () => {
  test('unauthenticated user is redirected from /jobs/J1 to /login', async ({
    page,
  }) => {
    await page.goto('/jobs/J1', { waitUntil: 'networkidle' })
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
    await expect(p2Detail.getByText('7')).toBeVisible({ timeout: 15000 })
  })
})
