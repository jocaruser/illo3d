import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Page } from '@playwright/test'
import { APP_VERSION } from '../../src/Config/version'
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

async function answerBackupAndContinue(
  page: Page,
  answer: 'wizard-backup-yes' | 'wizard-backup-no',
): Promise<void> {
  const continueButton = page.getByTestId('wizard-migration-continue')
  await expect(continueButton).toBeDisabled()
  await page.getByTestId(answer).click()
  await expect(page.getByTestId('wizard-cooldown-check')).toBeVisible({ timeout: 10000 })
  await expect(continueButton).toBeEnabled()
  await continueButton.click()
}

async function confirmMigration(page: Page): Promise<void> {
  const confirm = page.getByTestId('wizard-migration-confirm')
  await expect(confirm).toBeVisible({ timeout: 20000 })
  await confirm.click()
}

interface ShopMetadataOnDisk {
  version: string
  spreadsheetId: string
}

test.describe('Google Drive: migration wizard runs to completion', () => {
  test('declining the backup keeps the same spreadsheet until confirm persists', async ({
    page,
  }) => {
    const fake = await mockDriveApis(page, { pasteFolderMode: 'bad_version' })
    const folderId = PASTE_FOLDER_IDS.bad_version
    const metadataPath = path.join(fake.store.pathOf(folderId), 'illo3d.metadata.json')
    const metadataBefore = JSON.parse(
      fs.readFileSync(metadataPath, 'utf8'),
    ) as ShopMetadataOnDisk

    await mockGoogleOAuth(page)
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await completeWizardGoogleDriveWelcome(page)
    await page.locator('#wizard-folder-id').fill(folderId)
    await page.getByTestId('wizard-google-open-by-id').click()
    await expect(page.getByTestId('wizard-migration-continue')).toBeVisible({ timeout: 15000 })

    await answerBackupAndContinue(page, 'wizard-backup-no')
    await expect
      .poll(
        () => (JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as ShopMetadataOnDisk).version,
        { timeout: 15000 },
      )
      .toBe(metadataBefore.version)

    await confirmMigration(page)
    await waitForShopDataReady(page)

    await expect
      .poll(
        () => (JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as ShopMetadataOnDisk).version,
        { timeout: 15000 },
      )
      .toBe(APP_VERSION)

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8')) as ShopMetadataOnDisk
    expect(metadata.spreadsheetId).toBe(SEEDED_SPREADSHEET_ID)

    fake.store.sync()
    expect(fake.store.get(SEEDED_SPREADSHEET_ID)).toBeDefined()
  })
})
