import { test, expect } from './fixtures'

test.describe('Audit Log page (empty)', () => {
  test('navigates from header, shows title and empty state', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(
      page.getByRole('heading', { name: /dashboard|panel/i })
    ).toBeVisible()

    await page.getByTestId('nav-audit-log').click()
    await expect(page).toHaveURL(/\/audit-log/)

    await expect(page.getByTestId('audit-log-page')).toBeVisible()

    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByTestId('audit-log-empty-state')).toBeVisible()
  })

  test('direct navigation shows audit log empty state', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await page.goto('/#/audit-log', { waitUntil: 'load' })

    await expect(page.getByTestId('audit-log-page')).toBeVisible()

    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByTestId('audit-log-empty-state')).toBeVisible()
  })
})

test.describe('Audit Log page (with data)', () => {
  test.use({ fixtureScenario: 'audit-rich' })

  test('renders loaded audit entries sorted by timestamp desc', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(
      page.getByRole('heading', { name: /dashboard|panel/i })
    ).toBeVisible()

    await page.getByTestId('nav-audit-log').click()
    await expect(page).toHaveURL(/\/audit-log/)

    await expect(page.getByTestId('audit-log-page')).toBeVisible()

    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByTestId('audit-log-empty-state')).not.toBeVisible()

    // Most recent valid entry from audit-rich fixture (AL1014) should appear first
    const firstDataRow = page.locator('tbody tr').first()
    await expect(firstDataRow).toContainText('AL1014')

    // Malformed rows are also rendered (not silently discarded)
    const rows = page.getByRole('row')
    await expect(rows.filter({ hasText: /MALFORMED_1/ })).toBeVisible()
    await expect(rows.filter({ hasText: /MALFORMED_2/ })).toBeVisible()
    await expect(rows.filter({ hasText: /AL1015/ })).toBeVisible()
  })
})
