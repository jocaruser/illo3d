import { test, expect } from './fixtures'

test.use({ storageState: { cookies: [], origins: [] } })

/** Dev login; in CSV mode wizard shows immediately (no shop set). */
async function devLoginAndShowWizard(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'load' })
  const devLoginButton = page.getByTestId('dev-login-button')
  await expect(devLoginButton).toBeVisible({ timeout: 15000 })
  await devLoginButton.click()
  await expect(page).toHaveURL(/\/dashboard/)
}

/** Complete wizard by opening configured fixture folder (CSV mode, VITE_LOCAL_CSV_FIXTURE_FOLDER). */
async function completeWizardWithFolder(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /local csv|csv local/i }).first().click()
  await page.getByRole('button', { name: /open existing shop|abrir tienda existente/i }).first().click()
  await page.getByRole('button', { name: /open existing shop|abrir tienda existente/i }).first().click()
}

test.describe('Setup wizard', () => {
  test('wizard step 1 shows storage options, Open existing shop and Cancel (CSV mode)', async ({
    page,
  }) => {
    await devLoginAndShowWizard(page)

    await expect(page.getByText(/local csv|csv local/i)).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /open existing shop|abrir tienda existente/i })).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('clicking Cancel on wizard step 1 redirects user to /login', async ({
    page,
  }) => {
    await devLoginAndShowWizard(page)

    const cancelButton = page.getByRole('button', { name: 'Cancel' })
    await expect(cancelButton).toBeVisible({ timeout: 5000 })
    await cancelButton.click()

    await expect(page).toHaveURL(/\/login/)
  })

  test('wizard does not appear when user has active shop', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await devLoginAndShowWizard(page)
    await completeWizardWithFolder(page)

    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: /open existing shop|abrir tienda existente/i })).not.toBeVisible()
  })
})
