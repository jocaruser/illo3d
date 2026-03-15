import { test, expect } from '@playwright/test'

async function devLoginThenClearShop(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'networkidle' })

  const devLoginButton = page.getByTestId('dev-login-button')
  await expect(devLoginButton).toBeVisible({ timeout: 15000 })
  await devLoginButton.click()

  await expect(page).toHaveURL(/\/transactions/)

  await page.evaluate(() => {
    sessionStorage.removeItem('shop-storage')
  })

  await page.reload({ waitUntil: 'networkidle' })
}

test.describe('Setup wizard', () => {
  test('wizard step 1 shows Create new shop, Open existing folder, and Cancel', async ({
    page,
  }) => {
    await devLoginThenClearShop(page)

    await expect(page.getByRole('button', { name: 'Create new shop' })).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('button', { name: 'Open existing folder' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test('clicking Cancel on wizard step 1 redirects user to /login', async ({
    page,
  }) => {
    await devLoginThenClearShop(page)

    const cancelButton = page.getByRole('button', { name: 'Cancel' })
    await expect(cancelButton).toBeVisible({ timeout: 5000 })
    await cancelButton.click()

    await expect(page).toHaveURL(/\/login/)
  })

  test('empty folder name is rejected with validation error', async ({ page }) => {
    await devLoginThenClearShop(page)

    await page.getByRole('button', { name: 'Create new shop' }).click()

    const createButton = page.getByRole('button', { name: 'Create' })
    await expect(createButton).toBeVisible({ timeout: 5000 })
    await createButton.click()

    await expect(page.getByText(/enter folder name/i)).toBeVisible({
      timeout: 5000,
    })
  })

  test('wizard does not appear when user has active shop', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' })

    const devLoginButton = page.getByTestId('dev-login-button')
    await expect(devLoginButton).toBeVisible({ timeout: 15000 })
    await devLoginButton.click()

    await expect(page).toHaveURL(/\/transactions/)
    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()

    await expect(page.getByRole('button', { name: 'Create new shop' })).not.toBeVisible()
  })
})
