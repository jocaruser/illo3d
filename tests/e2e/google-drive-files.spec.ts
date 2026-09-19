import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseCsv, serializeCsv } from 'google-drive-api-mock'
import { SHEET_HEADERS } from '../../src/Config/schema'
import {
  test,
  expect,
  completeWizardGoogleDriveWelcome,
  mockDriveApis,
  mockGoogleOAuth,
  waitForShopDataReady,
} from './fixtures'
import { PASTE_FOLDER_IDS, SEEDED_SPREADSHEET_ID } from './helpers/mockDriveApis'

test.use({ storageState: { cookies: [], origins: [] } })

/**
 * The stateful sequence Success Criteria requires: seed a row directly on
 * disk (bypassing the app entirely), open the shop and see it render, then
 * create a second row through the UI and assert the live double's own CSV
 * file — not a canned in-process value — now holds both rows.
 */
test.describe('Google Drive: stateful client create/edit/save', () => {
  test('a seeded row renders, and a UI-created row persists to the live double', async ({
    page,
  }) => {
    const fake = await mockDriveApis(page, { pasteFolderMode: 'ok' })
    const clientsCsvPath = path.join(fake.store.pathOf(SEEDED_SPREADSHEET_ID), 'clients.csv')
    fs.writeFileSync(
      clientsCsvPath,
      serializeCsv([
        [...SHEET_HEADERS.clients],
        ['CL1', 'Seeded Client', '', '', '', '', '', '', '2025-01-01', '', ''],
      ]),
    )

    await mockGoogleOAuth(page)
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await completeWizardGoogleDriveWelcome(page)
    await page.locator('#wizard-folder-id').fill(PASTE_FOLDER_IDS.ok)
    await page.getByTestId('wizard-google-open-by-id').click()
    await waitForShopDataReady(page)

    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Seeded Client')).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: /add client|añadir cliente/i }).click()
    await expect(
      page.getByRole('heading', { name: /add client|añadir cliente/i }),
    ).toBeVisible()
    const newName = `E2E Live Client ${Date.now()}`
    await page.locator('#client-name').fill(newName)
    await Promise.all([
      page.waitForURL(/\/clients\/CL\d+/, { timeout: 20000 }),
      page.getByRole('button', { name: /create client|crear cliente/i }).click(),
    ])
    await expect(page.getByRole('heading', { name: newName })).toBeVisible({ timeout: 20000 })

    await expect
      .poll(
        () => {
          const rows = parseCsv(fs.readFileSync(clientsCsvPath, 'utf8'))
          return rows.map((row) => row[1])
        },
        { timeout: 15000 },
      )
      .toEqual(['name', 'Seeded Client', newName])
  })
})
