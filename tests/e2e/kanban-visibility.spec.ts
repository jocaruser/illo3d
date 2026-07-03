import path from 'node:path'
import { test, expect } from './fixtures'
import {
  copyGoldenFixtureToE2eRoot,
  mockDirectoryPicker,
  waitForShopDataReady,
} from './fixtures'
import { replaceDatePlaceholdersInFixture } from './helpers/prepareKanbanFixture'

const SCENARIO = 'kanban-stale-jobs'

test.use({ storageState: { cookies: [], origins: [] } })

async function openShopWithFixture(page: Parameters<typeof mockDirectoryPicker>[0]) {
  await page.goto('/#/dashboard', { waitUntil: 'load' })
  await page.evaluate(() => {
    localStorage.removeItem('shop-storage')
    localStorage.removeItem('backend-storage')
  })
  await page.reload({ waitUntil: 'load' })
  await mockDirectoryPicker(page, SCENARIO, 'with-metadata')
  const localBtn = page.getByTestId('wizard-local-folder')
  await expect(localBtn).toBeVisible({ timeout: 15000 })
  await localBtn.click()
  await waitForShopDataReady(page)
}

test.describe('Kanban visibility', () => {
  test.beforeEach(async ({ page }) => {
    copyGoldenFixtureToE2eRoot(SCENARIO)
    const fixtureDir = path.join(process.cwd(), '.e2e-fixtures', SCENARIO)
    replaceDatePlaceholdersInFixture(fixtureDir)
    await openShopWithFixture(page)
  })

  test('stale paid job is hidden from kanban', async ({ page }) => {
    await expect(page.getByText('Old paid job')).not.toBeVisible()
  })

  test('recent paid job is visible on kanban', async ({ page }) => {
    await expect(page.getByText('Recent paid job')).toBeVisible()
  })

  test('stale cancelled job is hidden from kanban', async ({ page }) => {
    await expect(page.getByText('Old cancelled job')).not.toBeVisible()
  })

  test('recent cancelled job is visible on kanban', async ({ page }) => {
    await expect(page.getByText('Recent cancelled job')).toBeVisible()
  })

  test('delivered job is visible regardless of age', async ({ page }) => {
    await expect(page.getByText('Desk organizer')).toBeVisible()
  })

  test('draft and in_progress jobs are always visible', async ({ page }) => {
    await expect(page.getByText('Phone case prototype')).toBeVisible()
    await expect(page.getByText('Replacement gear')).toBeVisible()
  })

  test('cancelled column is not capped at 10', async ({ page }) => {
    const cancelledHeading = page.getByRole('heading', { name: /cancelled|cancelado/i })
    const columnContainer = cancelledHeading.locator('..').locator('..')
    const cards = columnContainer.getByTestId(/^kanban-drag-/)
    await expect(cards).toHaveCount(14)
  })

  test('stale jobs do not appear in any column', async ({ page }) => {
    await expect(page.getByText('Old paid job')).not.toBeVisible()
    await expect(page.getByText('Old cancelled job')).not.toBeVisible()
  })

  test('no View All link in cancelled column', async ({ page }) => {
    const kanbanSection = page.getByRole('heading', { name: /jobs|trabajos/i }).locator('..')
    await expect(
      kanbanSection.getByRole('link', { name: /view all|ver todos/i }),
    ).not.toBeVisible()
  })
})

test.describe('Kanban visibility with custom threshold', () => {
  test.beforeEach(async ({ page }) => {
    copyGoldenFixtureToE2eRoot(SCENARIO)
    const fixtureDir = path.join(process.cwd(), '.e2e-fixtures', SCENARIO)
    replaceDatePlaceholdersInFixture(fixtureDir)
    const metadataPath = path.join(fixtureDir, 'illo3d.metadata.json')
    const fs = await import('node:fs')
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'))
    metadata.kanban = { autoCardsHideAfterXDays: 1 }
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')
    await openShopWithFixture(page)
  })

  test('paid job older than custom threshold is hidden', async ({ page }) => {
    await expect(page.getByText('Recent paid job')).not.toBeVisible()
  })

  test('cancelled job exactly at threshold is visible', async ({ page }) => {
    await expect(page.getByText('Recent cancelled job')).toBeVisible()
  })
})
