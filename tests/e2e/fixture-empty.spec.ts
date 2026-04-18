import { copyGoldenFixtureToE2eRoot, mockAndOpenLocalShop, test, expect } from './fixtures'

test.describe('Empty CSV fixture scenario', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('transactions shows empty state', async ({ page }) => {
    copyGoldenFixtureToE2eRoot('empty')
    await mockAndOpenLocalShop(page, 'empty')

    await page.goto('/transactions', { waitUntil: 'load' })

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.locator('[aria-modal="true"]')).toHaveCount(0, {
      timeout: 20000,
    })
    await expect(
      page.getByText(/connecting to google sheets|conectando a google sheets/i),
    ).not.toBeVisible({ timeout: 30000 })
    await expect(
      page.getByText(
        /no transactions yet|no hay transacciones|añade datos en google sheets/i
      )
    ).toBeVisible({ timeout: 15000 })
  })
})
