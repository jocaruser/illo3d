import { test, expect } from './fixtures'

test.describe('Empty CSV fixture scenario', () => {
  test.use({ fixtureScenario: 'empty' })

  test('transactions shows empty state', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.locator('[aria-modal="true"]')).toHaveCount(0, {
      timeout: 20000,
    })
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 30000,
    })
    await expect(
      page.getByText(
        /no transactions yet|no hay transacciones|añade datos en google sheets/i
      )
    ).toBeVisible({ timeout: 15000 })
  })
})
