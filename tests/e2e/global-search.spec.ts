import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

async function openSearchPanel(page: Page) {
  await expect(page.getByTestId('global-search-listbox')).toBeVisible({
    timeout: 30000,
  })
}

test.describe('Global header search', () => {
  test.beforeEach(async ({ page, openCsvShop }) => {
    void openCsvShop
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
  })

  test('finds client and navigates to client detail', async ({ page }) => {
    const search = page.getByTestId('global-header-search')
    await expect(search).toBeVisible()
    await search.fill('CL1')
    await openSearchPanel(page)
    await page.getByTestId('global-search-option-client-CL1').click()
    await expect(page).toHaveURL(/\/clients\/CL1/)
    await expect(page.getByRole('heading', { name: 'Beta LLC' })).toBeVisible({
      timeout: 10000,
    })
  })

  test('piece match navigates to parent job', async ({ page }) => {
    const search = page.getByTestId('global-header-search')
    await search.fill('P1')
    await openSearchPanel(page)
    await page.getByTestId('global-search-option-piece-P1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)
    await expect(
      page.getByRole('heading', { name: 'Phone case prototype' })
    ).toBeVisible({ timeout: 10000 })
  })

  test('client note body match navigates to client', async ({ page }) => {
    const search = page.getByTestId('global-header-search')
    await search.fill('Prefers invoices')
    await openSearchPanel(page)
    await page.getByTestId('global-search-option-client_note-CN1').click()
    await expect(page).toHaveURL(/\/clients\/CL1/)
  })

  test('job note navigates to job', async ({ page }) => {
    const search = page.getByTestId('global-header-search')
    await search.fill('JN1')
    await openSearchPanel(page)
    await page.getByTestId('global-search-option-job_note-JN1').click()
    await expect(page).toHaveURL(/\/jobs\/J1/)
  })

  test('transaction match opens transactions list', async ({ page }) => {
    const search = page.getByTestId('global-header-search')
    await search.fill('Print job A')
    await search.press('Enter')
    await expect(page).toHaveURL(/\/transactions/)
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })
  })

  test('inventory id opens inventory list', async ({ page }) => {
    const search = page.getByTestId('global-header-search')
    await search.fill('INV1')
    await search.press('Enter')
    await expect(page).toHaveURL(/\/inventory/)
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible({
      timeout: 10000,
    })
  })

  test('transaction id opens transactions list', async ({ page }) => {
    const search = page.getByTestId('global-header-search')
    await search.fill('T11')
    await search.press('Enter')
    await expect(page).toHaveURL(/\/transactions/)
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })
  })

  test('tag id opens clients when tag linked to client', async ({ page }) => {
    const search = page.getByTestId('global-header-search')
    await search.fill('TG1')
    await search.press('Enter')
    await expect(page).toHaveURL(/\/clients/)
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })
  })
})
