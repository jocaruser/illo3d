import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from './fixtures'

test.describe('Job edit and delete', () => {
  test.describe.configure({ mode: 'serial' })

  test('deleting a job removes its notes from persisted CSV', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    const notesPath = path.join(
      process.cwd(),
      '.e2e-fixtures',
      'happy-path',
      'crm_notes.csv'
    )

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    expect(fs.readFileSync(notesPath, 'utf8')).toContain(
      'e2e-cascade-delete-note-marker'
    )
    await expect(page.getByRole('row', { name: /E2E disposable job/i })).toBeVisible()
    await page.getByTestId('job-delete-J5').click()
    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(
      page.getByRole('heading', { name: /delete job|eliminar trabajo/i })
    ).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('row', { name: /E2E disposable job/i })).toHaveCount(0)

    const after = fs.readFileSync(notesPath, 'utf8')
    expect(after).not.toContain('e2e-cascade-delete-note-marker')
    expect(after).toContain('JN1')
  })

  test('edit job from table row updates description', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-edit-J4').click()
    const tableEditDialog = page.getByRole('dialog', {
      name: /edit job|editar trabajo/i,
    })
    await expect(tableEditDialog).toBeVisible()

    const newDesc = `e2e table edit ${Date.now()}`
    await tableEditDialog
      .getByPlaceholder(/what are you printing|qué vas a imprimir/i)
      .fill(newDesc)
    await tableEditDialog.getByRole('button', { name: /save|guardar/i }).click()

    await expect(tableEditDialog).not.toBeVisible({ timeout: 15000 })
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
    const detailEditDialog = page.getByRole('dialog', {
      name: /edit job|editar trabajo/i,
    })
    await expect(detailEditDialog).toBeVisible()

    const newDesc = `e2e detail edit ${Date.now()}`
    await detailEditDialog
      .getByPlaceholder(/what are you printing|qué vas a imprimir/i)
      .fill(newDesc)
    await detailEditDialog.getByRole('button', { name: /save|guardar/i }).click()

    await expect(detailEditDialog).not.toBeVisible({ timeout: 15000 })
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

    await expect(page.getByRole('row', { name: /Logo keychain batch/i })).toBeVisible()
    await page.getByTestId('job-delete-J4').click()
    await expect(
      page.getByRole('heading', { name: /delete job|eliminar trabajo/i })
    ).toBeVisible()

    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(
      page.getByRole('heading', { name: /delete job|eliminar trabajo/i })
    ).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('row', { name: /Logo keychain batch/i })).toHaveCount(0)
  })

  test('delete job cascades pieces and removes job', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await expect(page.getByRole('row', { name: /Replacement gear/i })).toBeVisible()
    await page.getByTestId('job-delete-J2').click()
    await page.getByRole('button', { name: /confirm|confirmar/i }).click()
    await expect(
      page.getByRole('heading', { name: /delete job|eliminar trabajo/i })
    ).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('row', { name: /Replacement gear/i })).toHaveCount(0)

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
    await expect(page.getByRole('row', { name: /Desk organizer/i })).toHaveCount(0)
  })

  test('job detail shows CRM tags and notes', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-detail-link-J1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)

    await expect(page.getByTestId('job-tags-section')).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByTestId('job-tag-chip-TG1')).toContainText(/Vip/i)
    await expect(page.getByTestId('job-notes-severity-strip')).toBeVisible()
    await expect(page.getByTestId('job-note-row-JN1')).toContainText(
      /bottom shell|parte inferior/i,
    )
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
    await expect(page.getByRole('row', { name: /Phone case prototype/i })).toBeVisible()
  })
})
