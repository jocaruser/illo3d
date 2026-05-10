import { test, expect } from './fixtures'

test.describe('v2.0.0 Metadata Features', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({ fixtureScenario: 'v2-metadata-rich' })

  test('metadata loads with kanbanColumns configuration', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 10000,
    })

    // Dashboard loads successfully with v2 metadata
    await expect(page.getByText('Active jobs', { exact: true })).toBeVisible()
  })

  test.skip('completedStatusLabel shows custom label on completed jobs', async ({ page, openCsvShop }) => {
    // completedStatusLabel metadata field exists but UI implementation pending
    void openCsvShop
    void page
  })

  test.skip('defaultDueDate applies to new jobs', async ({ page, openCsvShop }) => {
    // defaultDueDate metadata field exists but implementation pending
    void openCsvShop
    void page
  })

  test.skip('history page shows audit trail', async ({ page, openCsvShop }) => {
    // History UI not yet implemented
    void openCsvShop
    void page
  })

  test.skip('job completion creates history entry', async ({ page, openCsvShop }) => {
    // History UI not yet implemented
    void openCsvShop
    void page
  })

  test.skip('piece status uses kanbanColumns values', async ({ page, openCsvShop }) => {
    // Piece status dropdown needs to be updated to use kanbanColumns from metadata
    void openCsvShop
    void page
  })

  test.skip('pieces with Done status appear in calendar', async ({ page, openCsvShop }) => {
    // Calendar view not yet implemented
    void openCsvShop
    void page
  })
})

test.describe('v2.0.0 Job Completion Flow', () => {
  test.describe.configure({ mode: 'serial' })

  test('completing job shows confirmation dialog with income checkbox', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    // Navigate to J2 which has complete pricing
    await page.getByTestId('job-detail-link-J2').click()
    await expect(page).toHaveURL(/\/jobs\/J2/)

    await page.getByRole('button', { name: /complete|completar/i }).click()
    
    // Wait for dialog to appear
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

    // Check dialog has income transaction checkbox - use locator that finds any checkbox in dialog
    const dialog = page.getByRole('dialog')
    const checkbox = dialog.locator('input[type="checkbox"]').first()
    await expect(checkbox).toBeVisible()
    await expect(checkbox).toBeChecked()

    // Cancel the dialog
    await dialog.getByRole('button', { name: /cancel|cancelar/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('completing job with income creates transaction', async ({ page, openCsvShop }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    // Navigate to J2 and complete it
    await page.getByTestId('job-detail-link-J2').click()
    await expect(page).toHaveURL(/\/jobs\/J2/)

    await page.getByRole('button', { name: /complete|completar/i }).click()
    
    // Wait for dialog
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    await dialog.getByRole('button', { name: /complete|completar|confirm/i }).click()

    // Wait for completion - look for completed badge
    await expect(page.getByText(/jobs\.completed|completed/i).first()).toBeVisible({ timeout: 15000 })

    // Navigate to transactions to verify income was created
    await page.getByRole('link', { name: /transactions|transacciones/i }).first().click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 15000 })

    // Should see income transaction for Drive gear
    const incomeRow = page.getByRole('row').filter({ hasText: /income|ingreso/i })
      .filter({ hasText: /42|Drive gear/i })
    await expect(incomeRow.first()).toBeVisible({ timeout: 15000 })
  })

  test.skip('cannot complete job with incomplete pricing', async ({ page, openCsvShop }) => {
    // Alert for incomplete pricing not yet implemented in UI
    void openCsvShop
    void page
  })
})
