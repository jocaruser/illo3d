import { test, expect } from './fixtures'

test.describe('Job edit and delete', () => {
  test.describe.configure({ mode: 'serial' })

  test('edit job from table row updates description', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-edit-J4').click()
    await expect(
      page.getByRole('heading', { name: /edit job|editar trabajo/i })
    ).toBeVisible()

    const newDesc = `e2e table edit ${Date.now()}`
    await page
      .getByPlaceholder(/what are you printing|qué vas a imprimir/i)
      .fill(newDesc)
    await page.getByRole('button', { name: /save|guardar/i }).click()

    await expect(
      page.getByRole('heading', { name: /edit job|editar trabajo/i })
    ).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('cell', { name: newDesc })).toBeVisible({
      timeout: 15000,
    })
  })

  test('edit job from detail page updates header', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J3').click()
    await expect(page).toHaveURL(/\/jobs\/J3/)
    await expect(page.getByText('Desk organizer')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('entity-detail-edit').click()
    await expect(
      page.getByRole('heading', { name: /edit job|editar trabajo/i })
    ).toBeVisible()

    const newDesc = `e2e detail edit ${Date.now()}`
    await page
      .getByPlaceholder(/what are you printing|qué vas a imprimir/i)
      .fill(newDesc)
    await page.getByRole('button', { name: /save|guardar/i }).click()

    await expect(
      page.getByRole('heading', { name: /edit job|editar trabajo/i })
    ).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: newDesc })).toBeVisible({
      timeout: 15000,
    })
  })

  test('delete job with no pieces removes row', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await expect(page.getByRole('row', { name: /J4/ })).toBeVisible()
    await page.getByTestId('job-delete-J4').click()
    await expect(
      page.getByRole('heading', { name: /delete job|eliminar trabajo/i })
    ).toBeVisible()

    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(
      page.getByRole('heading', { name: /delete job|eliminar trabajo/i })
    ).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('row', { name: /J4/ })).toHaveCount(0)
  })

  test('delete job cascades pieces and removes job', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await expect(page.getByRole('row', { name: /J2/ })).toBeVisible()
    await page.getByTestId('job-delete-J2').click()
    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(
      page.getByRole('heading', { name: /delete job|eliminar trabajo/i })
    ).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('row', { name: /J2/ })).toHaveCount(0)

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)
    await expect(page.getByText('Drive gear')).toHaveCount(0)
  })

  test('delete from detail navigates to jobs list', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J3').click()
    await expect(page).toHaveURL(/\/jobs\/J3/)

    await page.getByTestId('entity-detail-delete').click()
    await page.getByRole('button', { name: /confirm|confirmar/i }).click()

    await expect(page).toHaveURL(/\/jobs$/)
    await expect(page.getByRole('row', { name: /J3/ })).toHaveCount(0)
  })

  test('cancel delete keeps job', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-delete-J1').click()
    await expect(
      page.getByRole('heading', { name: /delete job|eliminar trabajo/i })
    ).toBeVisible()

    await page.getByRole('button', { name: /cancel|cancelar/i }).click()
    await expect(
      page.getByRole('heading', { name: /delete job|eliminar trabajo/i })
    ).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('row', { name: /J1/ })).toBeVisible()
  })
})
