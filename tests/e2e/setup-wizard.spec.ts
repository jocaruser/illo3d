import { test, expect } from '@playwright/test'

/** Dev login; in CSV mode wizard shows immediately (no shop set). */
async function devLoginAndShowWizard(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'networkidle' })
  const devLoginButton = page.getByTestId('dev-login-button')
  await expect(devLoginButton).toBeVisible({ timeout: 15000 })
  await devLoginButton.click()
  await expect(page).toHaveURL(/\/transactions/)
}

/** Complete wizard by opening a fixture folder (CSV mode). */
async function completeWizardWithFolder(
  page: import('@playwright/test').Page,
  folderName: string
) {
  await page.getByRole('button', { name: 'Open existing folder' }).click()
  await page.getByPlaceholder('e.g. happy-path, missingcolumn').fill(folderName)
  await page.getByRole('button', { name: 'Open' }).click()
}

test.describe('Setup wizard', () => {
  test('wizard step 1 shows Open existing folder and Cancel (CSV mode)', async ({
    page,
  }) => {
    await devLoginAndShowWizard(page)

    // CSV mode: only Open existing and Cancel (no Create new)
    await expect(page.getByRole('button', { name: 'Open existing folder' })).toBeVisible({
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

  test('empty fixture folder name is rejected with validation error', async ({
    page,
  }) => {
    await devLoginAndShowWizard(page)

    await page.getByRole('button', { name: 'Open existing folder' }).click()

    const openButton = page.getByRole('button', { name: 'Open' })
    await expect(openButton).toBeVisible({ timeout: 5000 })
    await openButton.click()

    await expect(page.getByText(/enter a fixture folder name/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test('wizard does not appear when user has active shop', async ({ page }) => {
    await devLoginAndShowWizard(page)
    await completeWizardWithFolder(page, 'happy-path')

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: 'Open existing folder' })).not.toBeVisible()
  })
})
