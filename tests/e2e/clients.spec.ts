import { test, expect } from '@playwright/test'

async function devLoginAndOpenShop(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'networkidle' })

  const devLoginButton = page.getByTestId('dev-login-button')
  await expect(devLoginButton).toBeVisible({ timeout: 15000 })
  await devLoginButton.click()

  await expect(page).toHaveURL(/\/transactions/)

  const openExistingButton = page.getByRole('button', {
    name: /open existing shop|abrir tienda existente/i,
  })
  if (await openExistingButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.getByRole('button', { name: /local csv|csv local/i }).first().click()
    await openExistingButton.first().click()
    await page.getByRole('button', { name: /open existing shop|abrir tienda existente/i }).first().click()
  }
}

test.describe('Clients page', () => {
  test('clients table visible after navigating from header', async ({ page }) => {
    await devLoginAndOpenShop(page)

    await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible({
      timeout: 10000,
    })

    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page).toHaveURL(/\/clients/)
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('table')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Acme Corp')).toBeVisible()
  })

  test('add client opens popup and creates client', async ({ page }) => {
    await devLoginAndOpenShop(page)
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })

    await page.getByRole('button', { name: /add client|añadir cliente/i }).click()
    await expect(page.getByRole('heading', { name: /add client|añadir cliente/i })).toBeVisible()

    const uniqueName = `E2E Client ${Date.now()}`
    await page.getByLabel(/name|nombre/i).fill(uniqueName)
    await page.getByRole('button', { name: /create client|crear cliente/i }).click()

    await expect(page.getByRole('cell', { name: uniqueName })).toBeVisible({
      timeout: 20000,
    })
  })

  test('create client validates name', async ({ page }) => {
    await devLoginAndOpenShop(page)
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })

    await page.getByRole('button', { name: /add client|añadir cliente/i }).click()
    await page.getByRole('button', { name: /create client|crear cliente/i }).click()

    await expect(
      page.getByText(/name is required|el nombre es obligatorio/i)
    ).toBeVisible()
  })

  test('no edit or delete buttons on clients page', async ({ page }) => {
    await devLoginAndOpenShop(page)
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByRole('button', { name: /^edit$/i })).not.toBeVisible()
    await expect(page.getByRole('button', { name: /delete|remove/i })).not.toBeVisible()
  })
})
