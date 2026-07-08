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

    // All fixture entries are rendered (including malformed rows)
    const rows = page.getByRole('row')
    await expect(rows.filter({ hasText: /AL1015/ })).toBeVisible()
    await expect(rows.filter({ hasText: /AL1014/ })).toBeVisible()
    await expect(rows.filter({ hasText: /MALFORMED_1/ })).toBeVisible()
    await expect(rows.filter({ hasText: /MALFORMED_2/ })).toBeVisible()

    // Verify descending timestamp order: AL1015 (2026-01-16) appears before AL1014 (2026-01-15)
    const al1015Row = page.locator('tbody tr').filter({ hasText: /AL1015/ }).first()
    const al1014Row = page.locator('tbody tr').filter({ hasText: /AL1014/ }).first()
    await expect(al1015Row).toBeVisible()
    await expect(al1014Row).toBeVisible()

    // AL1015 should appear in a row that comes before AL1014's row in DOM order
    const al1015Index = await al1015Row.evaluate((el) =>
      Array.from(el.parentElement!.children).indexOf(el)
    )
    const al1014Index = await al1014Row.evaluate((el) =>
      Array.from(el.parentElement!.children).indexOf(el)
    )
    expect(al1015Index).toBeLessThan(al1014Index)

    // Malformed rows have red background and danger text
    await expect(al1015Row).toHaveClass(/bg-red-100/)
    await expect(al1015Row).toHaveClass(/text-danger/)
    await expect(
      page.locator('tbody tr').filter({ hasText: /MALFORMED_1/ }).first()
    ).toHaveClass(/bg-red-100/)
    await expect(
      page.locator('tbody tr').filter({ hasText: /MALFORMED_2/ }).first()
    ).toHaveClass(/bg-red-100/)

    // Valid row AL1014 has no red background
    await expect(al1014Row).not.toHaveClass(/bg-red-100/)
  })
})
