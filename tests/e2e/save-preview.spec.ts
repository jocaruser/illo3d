import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

/**
 * The save preview: pressing Save opens a review — sheet cards on one side, a
 * git-style diff on the other — where fields can be reverted individually and
 * the only exits are Save all and Discard all.
 */
test.describe('Save preview', () => {
  async function archiveGamma(page: Page) {
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })
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
  }

  test('shows the pending change as a diff with sheet cards', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await expect(page).toHaveURL(/\/dashboard/)
    await archiveGamma(page)

    await page.getByTestId('workbook-save').click()
    await expect(page).toHaveURL(/\/save/)
    await expect(page.getByTestId('save-preview-page')).toBeVisible({ timeout: 10000 })

    // The clients card reports the changed row; the audit log its new entry.
    await expect(page.getByTestId('save-nav-clients')).toContainText(
      /1 row changed|1 fila cambiada/i,
    )
    await expect(page.getByTestId('save-nav-audit_log')).toContainText(
      /new entr|entrada/i,
    )

    // The diff shows the archived row, linked to its client page.
    const card = page.getByTestId('row-diff-clients-CL2')
    await expect(card).toBeVisible()
    await expect(card.getByRole('link', { name: /Gamma Inc/i })).toHaveAttribute(
      'href',
      /\/clients\/CL2$/,
    )
  })

  test('reverts a field individually, then discards the rest', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await expect(page).toHaveURL(/\/dashboard/)
    await archiveGamma(page)

    await page.getByTestId('workbook-save').click()
    await expect(page.getByTestId('save-preview-page')).toBeVisible({ timeout: 10000 })

    // Revert the lifecycle flag the archive flipped.
    await page.locator('[data-testid^="revert-clients-CL2-"]').first().click()

    // The row nets to no change and leaves the diff; the revert is audit-logged.
    await expect(page.getByTestId('row-diff-clients-CL2')).not.toBeVisible()
    await expect(page.getByTestId('save-nav-audit_log')).toContainText(
      /2 new entries|2 entradas nuevas/i,
    )

    // Discard all clears the remaining audit tail after the usual confirmation.
    await page.getByTestId('save-preview-discard-all').click()
    await page
      .getByRole('dialog', { name: /discard unsaved changes|descartar cambios/i })
      .getByRole('button', { name: /discard and refresh|descartar y actualizar/i })
      .click()

    await expect(
      page.getByText(/nothing to save|nada que guardar/i),
    ).toBeVisible({ timeout: 15000 })

    // The client is back, untouched.
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('row', { name: /Gamma Inc/i })).toBeVisible({
      timeout: 15000,
    })
  })

  test('hides unchanged fields until asked', async ({ page, openCsvShop }) => {
    void openCsvShop
    await expect(page).toHaveURL(/\/dashboard/)
    await archiveGamma(page)

    await page.getByTestId('workbook-save').click()
    const card = page.getByTestId('row-diff-clients-CL2')
    await expect(card).toBeVisible({ timeout: 10000 })
    await expect(card.getByText('name', { exact: true })).not.toBeVisible()

    await page.getByTestId('save-preview-toggle-unchanged').click()

    await expect(card.getByText('name', { exact: true })).toBeVisible()
  })
})
