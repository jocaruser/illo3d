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

    // Malformed rows have red background and readable dark-red text
    await expect(al1015Row).toHaveClass(/bg-red-50/)
    await expect(al1015Row).toHaveClass(/text-red-900/)
    await expect(
      page.locator('tbody tr').filter({ hasText: /MALFORMED_1/ }).first()
    ).toHaveClass(/bg-red-50/)
    await expect(
      page.locator('tbody tr').filter({ hasText: /MALFORMED_2/ }).first()
    ).toHaveClass(/bg-red-50/)

    // Valid row AL1014 has no red background
    await expect(al1014Row).not.toHaveClass(/bg-red-50/)
  })

  test('renders action pills with correct colors', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.goto('/#/audit-log', { waitUntil: 'load' })
    await expect(page.getByTestId('audit-log-page')).toBeVisible()

    // Create action → green pill
    const createRow = page.locator('tbody tr').filter({ hasText: /AL001/ }).first()
    const createPill = createRow.locator('span').filter({ hasText: /CREATE/ })
    await expect(createPill).toHaveClass(/bg-success\/15/)
    await expect(createPill).toHaveClass(/text-success/)

    // Update action → blue pill
    const updateRow = page.locator('tbody tr').filter({ hasText: /AL111/ }).first()
    const updatePill = updateRow.locator('span').filter({ hasText: /UPDATE/ })
    await expect(updatePill).toHaveClass(/bg-primary\/15/)
    await expect(updatePill).toHaveClass(/text-primary/)

    // Archive action → red pill
    const archiveRow = page.locator('tbody tr').filter({ hasText: /AL075/ }).first()
    const archivePill = archiveRow.locator('span').filter({ hasText: /ARCHIVE/ })
    await expect(archivePill).toHaveClass(/bg-danger\/15/)
    await expect(archivePill).toHaveClass(/text-danger/)

    // Delete action → red pill
    const deleteRow = page.locator('tbody tr').filter({ hasText: /AL079/ }).first()
    const deletePill = deleteRow.locator('span').filter({ hasText: /DELETE/ })
    await expect(deletePill).toHaveClass(/bg-danger\/15/)
    await expect(deletePill).toHaveClass(/text-danger/)

    // Restore action → green pill
    const restoreRow = page.locator('tbody tr').filter({ hasText: /AL083/ }).first()
    const restorePill = restoreRow.locator('span').filter({ hasText: /RESTORE/ })
    await expect(restorePill).toHaveClass(/bg-success\/15/)
    await expect(restorePill).toHaveClass(/text-success/)
  })

  test('renders entity names as clickable links with correct routes', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await page.goto('/#/audit-log', { waitUntil: 'load' })
    await expect(page.getByTestId('audit-log-page')).toBeVisible()

    // Client entity link
    const clientRow = page.locator('tbody tr').filter({ hasText: /AL001/ }).first()
    const clientLink = clientRow.locator('a').filter({ hasText: /TechStart Solutions/ })
    await expect(clientLink).toBeVisible()
    await expect(clientLink).toHaveAttribute('href', '#/clients/CL1')

    // Job entity link
    const jobRow = page.locator('tbody tr').filter({ hasText: /AL200/ }).first()
    const jobLink = jobRow.locator('a').filter({ hasText: /Prototype batch/ })
    await expect(jobLink).toBeVisible()
    await expect(jobLink).toHaveAttribute('href', '#/jobs/J1')

    // Piece entity links to parent job
    const pieceRow = page.locator('tbody tr').filter({ hasText: /AL302/ }).first()
    const pieceLink = pieceRow.locator('a').filter({ hasText: /Alpha bracket/ })
    await expect(pieceLink).toBeVisible()
    await expect(pieceLink).toHaveAttribute('href', '#/jobs/J6')

    // Tag link (no detail page) shows raw ID with no <a>
    const tagLinkRow = page.locator('tbody tr').filter({ hasText: /AL702/ }).first()
    await expect(tagLinkRow.locator('a').filter({ hasText: /VIP/ })).not.toBeVisible()
    await expect(tagLinkRow).toContainText('VIP')
  })

  test('renders parent entity link for test row', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.goto('/#/audit-log', { waitUntil: 'load' })
    await expect(page.getByTestId('audit-log-page')).toBeVisible()

    const parentRow = page.locator('tbody tr').filter({ hasText: /AL1016/ }).first()
    const parentLink = parentRow.locator('a').filter({ hasText: /Piece test job/ })
    await expect(parentLink).toBeVisible()
    await expect(parentLink).toHaveAttribute('href', '#/jobs/J6')
  })

  test('renders empty parent entity cell when no parent data', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.goto('/#/audit-log', { waitUntil: 'load' })
    await expect(page.getByTestId('audit-log-page')).toBeVisible()

    // AL111 is a client update with empty parent_entity_name and parent_entity_id
    // Its before/after JSON have no commas, so CSV parsing is correct
    const row = page
      .locator('tbody tr')
      .filter({
        has: page.locator('td').filter({ hasText: /^AL111$/ }),
      })
      .first()
    await expect(row).toBeVisible()

    // Count cells and verify the 6th cell (Parent Entity, 0-indexed = 5) is empty
    const cells = row.locator('td')
    const cellCount = await cells.count()
    expect(cellCount).toBe(6)

    // Verify expected cell content (new column order: id, actor, action, entity, timestamp, parent)
    await expect(cells.nth(0)).toHaveText('AL111')
    await expect(cells.nth(2)).toContainText('UPDATE')
    await expect(cells.nth(3)).toHaveText('TechStart Solutions')
    await expect(cells.nth(4).locator('time')).toHaveAttribute('dateTime', '2025-03-02T10:00:00.000Z')
    await expect(cells.nth(5)).toHaveText('')
  })

  test('renders empty parent entity cell for AL1008 (row with JSON commas)', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.goto('/#/audit-log', { waitUntil: 'load' })
    await expect(page.getByTestId('audit-log-page')).toBeVisible()

    // AL1008 is a tag_link update with commas inside its quoted JSON before/after fields.
    // Naive split(',') would break the row and shift parent cells out of place.
    const row = page
      .locator('tbody tr')
      .filter({
        has: page.locator('td').filter({ hasText: /^AL1008$/ }),
      })
      .first()
    await expect(row).toBeVisible()

    const cells = row.locator('td')
    const cellCount = await cells.count()
    expect(cellCount).toBe(6)

    // Verify expected cell content (new column order: id, actor, action, entity, timestamp, parent)
    await expect(cells.nth(0)).toHaveText('AL1008')
    await expect(cells.nth(2)).toContainText('UPDATE')
    await expect(cells.nth(3)).toHaveText('TL4')
    await expect(cells.nth(4).locator('time')).toHaveAttribute('dateTime', '2026-01-09T11:00:00.000Z')
    await expect(cells.nth(5)).toHaveText('')
  })

  test('cascade archive entries show parent chain to root job', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.goto('/#/audit-log', { waitUntil: 'load' })
    await expect(page.getByTestId('audit-log-page')).toBeVisible()

    // AL1208: Job J14 archive (root of cascade) — no parent entity
    const archiveJobRow = page.locator('tbody tr').filter({ hasText: /AL1208/ }).first()
    await expect(archiveJobRow).toBeVisible()
    await expect(archiveJobRow.locator('span').filter({ hasText: /ARCHIVE/ })).toHaveClass(/bg-danger\/15/)
    await expect(archiveJobRow.locator('a').filter({ hasText: /Cascade draft job/ })).toBeVisible()
    await expect(archiveJobRow.locator('a').filter({ hasText: /Cascade draft job/ })).toHaveAttribute('href', '#/jobs/J14')

    // AL1209: Piece P7 archive with parent_entity=job J14
    const archivePieceRow = page.locator('tbody tr').filter({ hasText: /AL1209/ }).first()
    await expect(archivePieceRow).toBeVisible()
    await expect(archivePieceRow.locator('span').filter({ hasText: /ARCHIVE/ })).toHaveClass(/bg-danger\/15/)
    await expect(archivePieceRow.locator('a').filter({ hasText: /Cascade draft piece/ })).toBeVisible()
    await expect(archivePieceRow.locator('a').filter({ hasText: /Cascade draft piece/ })).toHaveAttribute('href', '#/jobs/J14')
    const p9ParentLink = archivePieceRow.locator('a').filter({ hasText: /Cascade draft job/ })
    await expect(p9ParentLink).toBeVisible()
    await expect(p9ParentLink).toHaveAttribute('href', '#/jobs/J14')

    // AL1210: Piece item PI6 archive with parent_entity=job J14
    const archivePi6Row = page.locator('tbody tr').filter({ hasText: /AL1210/ }).first()
    await expect(archivePi6Row).toBeVisible()
    await expect(archivePi6Row.locator('span').filter({ hasText: /ARCHIVE/ })).toHaveClass(/bg-danger\/15/)
    await expect(archivePi6Row.locator('a').filter({ hasText: /Item for Cascade draft piece/ })).toBeVisible()
    const pi6ParentLink = archivePi6Row.locator('a').filter({ hasText: /Cascade draft job/ })
    await expect(pi6ParentLink).toBeVisible()
    await expect(pi6ParentLink).toHaveAttribute('href', '#/jobs/J14')

    // AL1211: Piece item PI7 archive with parent_entity=job J14
    const archivePi7Row = page.locator('tbody tr').filter({ hasText: /AL1211/ }).first()
    await expect(archivePi7Row).toBeVisible()
    await expect(archivePi7Row.locator('span').filter({ hasText: /ARCHIVE/ })).toHaveClass(/bg-danger\/15/)
    await expect(archivePi7Row.locator('a').filter({ hasText: /Item for Cascade draft piece/ })).toBeVisible()
    const pi7ParentLink = archivePi7Row.locator('a').filter({ hasText: /Cascade draft job/ })
    await expect(pi7ParentLink).toBeVisible()
    await expect(pi7ParentLink).toHaveAttribute('href', '#/jobs/J14')
  })
})
