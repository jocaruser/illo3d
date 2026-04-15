import { test, expect } from './fixtures'

test.describe('Client detail CRM', () => {
  test('opens from clients list and shows metrics and severity strip', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 20000,
    })

    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('client-detail-link-CL1').click()
    await expect(page).toHaveURL(/\/clients\/CL1/)
    await expect(
      page.getByRole('heading', { name: 'Beta LLC' }),
    ).toBeVisible({ timeout: 15000 })
    await expect(
      page.getByText(/paid \(ledger\)|pagado \(libro\)/i),
    ).toBeVisible()
    await expect(page.getByTestId('client-notes-severity-strip')).toBeVisible()
  })

  test('jobs table client name links to client detail', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 20000,
    })

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })

    await page.getByTestId('job-client-link-J1').click()
    await expect(page).toHaveURL(/\/clients\/CL1/)
  })

  test('adds a CRM note inline', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 20000,
    })

    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })
    await page.getByTestId('client-detail-link-CL1').click()
    await expect(page).toHaveURL(/\/clients\/CL1/)
    await expect(
      page.getByRole('heading', { name: 'Beta LLC' }),
    ).toBeVisible({ timeout: 15000 })

    const body = `e2e crm note ${Date.now()}`
    await page
      .getByPlaceholder(/plain text note|nota en texto plano/i)
      .fill(body)
    await page.getByTestId('client-note-add').click()
    await expect(page.getByText(body)).toBeVisible({ timeout: 15000 })
  })

  test('CRM note renders piece @P2 mention as link to job', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 20000,
    })

    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })
    await page.getByTestId('client-detail-link-CL1').click()
    await expect(page).toHaveURL(/\/clients\/CL1/)
    await expect(
      page.getByRole('heading', { name: 'Beta LLC' }),
    ).toBeVisible({ timeout: 15000 })

    const pieceLink = page
      .getByTestId('client-note-row-CN3')
      .getByRole('link', { name: 'Phone case bottom shell' })
    await expect(pieceLink).toBeVisible({ timeout: 15000 })
    await pieceLink.click()
    await expect(page).toHaveURL(/\/jobs\/J1/)
    await expect(page).toHaveURL(/#piece-P2/)
  })

  test('CRM note renders job mention as link', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 20000,
    })

    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })
    await page.getByTestId('client-detail-link-CL1').click()
    await expect(page).toHaveURL(/\/clients\/CL1/)
    await expect(
      page.getByRole('heading', { name: 'Beta LLC' }),
    ).toBeVisible({ timeout: 15000 })

    await expect(
      page
        .getByTestId('client-note-row-CN2')
        .getByRole('link', { name: 'Phone case prototype' }),
    ).toBeVisible({ timeout: 15000 })
  })

  test('client detail shows fixture tag', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 20000,
    })

    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({
      timeout: 15000,
    })
    await page.getByTestId('client-detail-link-CL1').click()
    await expect(page).toHaveURL(/\/clients\/CL1/)

    await expect(page.getByTestId('client-tags-section')).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByTestId('client-tag-chip-TG1')).toContainText('Vip')
  })
})
