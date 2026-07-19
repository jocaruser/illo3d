import { test, expect } from './fixtures'

/**
 * The suite's bilingual regexes (/jobs|trabajos/i) only ever match the EN
 * branch at runtime, so a broken Spanish rendering would pass every other
 * spec. This one actually switches the app to Español and asserts key
 * screens render translated, including after a reload.
 */
test.describe('Spanish rendering', () => {
  test('switching to Español translates chrome and pages, and survives reload', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await page.getByTestId('profile-menu-trigger').click()
    await page.getByRole('menuitem', { name: 'Español' }).click()

    // The switch re-renders immediately: the menu's section header flips.
    await expect(page.getByText('Idioma')).toBeVisible()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('heading', { name: 'Panel' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByRole('link', { name: 'Trabajos' })).toBeVisible()

    await page.getByRole('link', { name: 'Trabajos' }).click()
    await expect(page.getByRole('heading', { name: 'Trabajos' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText('Phone case prototype')).toBeVisible({
      timeout: 15000,
    })

    // The preference persists: a full reload comes back in Spanish.
    await page.reload({ waitUntil: 'load' })
    await expect(page.getByRole('heading', { name: 'Trabajos' })).toBeVisible({
      timeout: 20000,
    })
  })
})
