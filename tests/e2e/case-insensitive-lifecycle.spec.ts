import { test, expect } from './fixtures'

test.use({ fixtureScenario: 'case-insensitive-lifecycle' })

test.describe('Case-insensitive lifecycle filtering', () => {
  test('archived job with uppercase TRUE is hidden from jobs list', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible({
      timeout: 10000,
    })

    await expect(
      page.getByRole('row', { name: /Phone case prototype/i }),
    ).toHaveCount(0)

    await expect(
      page.getByRole('row', { name: /Replacement gear/i }),
    ).toBeVisible()
  })

  test('archived job with lowercase true is hidden from jobs list', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible({
      timeout: 10000,
    })

    await expect(
      page.getByRole('row', { name: /Desk organizer/i }),
    ).toHaveCount(0)
  })

  test('archived client with uppercase TRUE is hidden from clients list', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })

    await expect(
      page.getByRole('row', { name: /Acme Corp/i }),
    ).toHaveCount(0)

    await expect(
      page.getByRole('row', { name: /Beta LLC/i }),
    ).toBeVisible()
  })

  test('active jobs and clients remain visible', async ({
    page,
    openCsvShop,
  }) => {
    void openCsvShop

    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByRole('heading', { name: 'Jobs' })).toBeVisible({
      timeout: 10000,
    })

    await expect(
      page.getByRole('row', { name: /Logo keychain batch/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('row', { name: /E2E disposable job/i }),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 10000,
    })

    await expect(
      page.getByRole('row', { name: /Gamma Inc/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('row', { name: /Delta Co/i }),
    ).toBeVisible()
  })
})
