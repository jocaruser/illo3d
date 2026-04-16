import { test, expect } from './fixtures'

test.describe('Clients page', () => {
  test('clients table visible after navigating from header', async ({ page, openCsvShop }) => {
    void openCsvShop

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

  test('list search filters client rows', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Acme Corp')).toBeVisible({ timeout: 15000 })

    await page.getByTestId('list-table-search').fill('nomatchzzzxx')
    await expect(
      page.getByText(/no rows match|ninguna fila/i)
    ).toBeVisible({ timeout: 5000 })

    await page.getByTestId('list-table-search').fill('')
    await expect(page.getByText('Acme Corp')).toBeVisible({ timeout: 5000 })
  })

  test('list search matches client tag names', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('link', { name: 'Beta LLC' })).toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('list-table-search').fill('VIP')
    await expect(page.getByRole('link', { name: 'Beta LLC' })).toBeVisible({
      timeout: 5000,
    })
    await expect(page.getByRole('link', { name: 'Acme Corp' })).not.toBeVisible()
  })

  test('client name shows tag tooltip on hover', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })

    const link = page.getByTestId('client-detail-link-CL1')
    await expect(link).toBeVisible({ timeout: 15000 })
    await link.hover()
    const tip = page.getByRole('tooltip')
    await expect(tip).toBeVisible()
    await expect(tip).toContainText(/VIP/i)
  })

  test('add client opens popup and creates client', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })

    await page.getByRole('button', { name: /add client|añadir cliente/i }).click()
    await expect(page.getByRole('heading', { name: /add client|añadir cliente/i })).toBeVisible()

    const uniqueName = `E2E Client ${Date.now()}`
    await page.locator('#client-name').fill(uniqueName)
    await page.getByRole('button', { name: /create client|crear cliente/i }).click()

    await expect(page.getByRole('cell', { name: uniqueName })).toBeVisible({
      timeout: 20000,
    })
  })

  test('create client validates name', async ({ page, openCsvShop }) => {
    void openCsvShop
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

  test('edit client updates name', async ({ page, openCsvShop }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })

    const row = page.getByRole('row', { name: /Acme Corp/i })
    await row.getByRole('button', { name: /edit|editar/i }).click()
    await expect(
      page.getByRole('heading', { name: /edit client|editar cliente/i })
    ).toBeVisible()

    const newName = `Acme E2E ${Date.now()}`
    await page.locator('#client-name').fill(newName)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /save|guardar/i })
      .click()

    await expect(page.getByRole('cell', { name: newName })).toBeVisible({
      timeout: 20000,
    })
  })

  test('archive client removes row from list', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })

    const row = page.getByRole('row', { name: /Acme Corp/i })
    await row
      .getByRole('button', { name: /archive|archivar|delete|eliminar/i })
      .click()

    await page
      .getByRole('dialog', {
        name: /archive client|archivar cliente|delete client|eliminar cliente/i,
      })
      .getByRole('button', { name: /archive|archivar|delete|eliminar/i })
      .click()

    await expect(page.getByRole('row', { name: /Acme Corp/i })).not.toBeVisible({
      timeout: 20000,
    })
  })

  test('archive client with jobs removes client from list (cascade)', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })

    const row = page.getByRole('row', { name: /Beta LLC/i })
    await row
      .getByRole('button', { name: /archive|archivar|delete|eliminar/i })
      .click()

    await page
      .getByRole('dialog', {
        name: /archive client|archivar cliente|delete client|eliminar cliente/i,
      })
      .getByRole('button', { name: /archive|archivar|delete|eliminar/i })
      .click()

    await expect(page.getByRole('row', { name: /Beta LLC/i })).not.toBeVisible({
      timeout: 20000,
    })
  })
})
