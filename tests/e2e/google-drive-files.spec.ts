import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  completeWizardGoogleDriveWelcome,
  mockDriveApis,
  mockGoogleOAuth,
  waitForShopDataReady,
  test,
  expect,
} from './fixtures'
import { PASTE_FOLDER_IDS } from './helpers/mockDriveApis'
import { SHEET_HEADERS } from '../../src/Config/schema'
import { parseCsv, serializeCsv } from 'google-drive-api-mock'

test.use({ storageState: { cookies: [], origins: [] } })

/**
 * The emulator's promise in one spec: Google-backend state is plain files.
 * Seed by writing a CSV, exercise the real app against the emulated Drive,
 * then assert on the final CSV — no per-endpoint stubbing anywhere.
 */
test.describe('Google Drive backend state as files', () => {
  test('seeded CSV rows show up in the app and UI edits land back in the CSV', async ({
    page,
  }) => {
    await mockGoogleOAuth(page)
    const fake = await mockDriveApis(page, { pasteFolderMode: 'ok' })

    // Init state: one client written straight into the seeded tab's CSV.
    const clientsCsv = path.join(
      fake.rootDir,
      'illo3d',
      'illo3d-data',
      'clients.csv'
    )
    const header = [...SHEET_HEADERS.clients]
    const row = header.map(() => '')
    row[header.indexOf('id')] = 'c-seeded'
    row[header.indexOf('name')] = 'Seeded From Disk'
    row[header.indexOf('created_at')] = '2025-01-01'
    fs.writeFileSync(clientsCsv, serializeCsv([header, row]))

    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await completeWizardGoogleDriveWelcome(page)
    await page.locator('#wizard-folder-id').fill(PASTE_FOLDER_IDS.ok)
    await page.getByTestId('wizard-google-open-by-id').click()
    await waitForShopDataReady(page)

    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByText('Seeded From Disk')).toBeVisible({
      timeout: 15000,
    })

    await page.getByRole('button', { name: /add client|añadir cliente/i }).click()
    await page.locator('#client-name').fill('Roundtrip Rita')
    await page
      .getByRole('button', { name: /create client|crear cliente/i })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Roundtrip Rita' })
    ).toBeVisible({ timeout: 15000 })

    // Nothing persists until Save (specs/saving.spec.md) — press it.
    await page.getByTestId('workbook-save').click()

    // Final state: the save flow rewrote the tab, so the CSV holds both rows.
    await expect
      .poll(() => fs.readFileSync(clientsCsv, 'utf8'), { timeout: 15000 })
      .toContain('Roundtrip Rita')
    const rows = parseCsv(fs.readFileSync(clientsCsv, 'utf8'))
    expect(rows[0]).toEqual(header)
    const names = rows.slice(1).map((cells) => cells[header.indexOf('name')])
    expect(names).toContain('Seeded From Disk')
    expect(names).toContain('Roundtrip Rita')
  })
})
