import type { Page } from '@playwright/test'
import {
  METADATA_FILE_NAME,
  SHEET_HEADERS,
  SHEET_NAMES,
  SPREADSHEET_NAME,
  type SheetName,
} from '../../../src/Config/schema'
import { APP_VERSION } from '../../../src/Config/version'
import { FOLDER_MIME, SPREADSHEET_MIME } from 'google-drive-api-mock'
import { mountFakeGoogle, type FakeGoogleMount } from './fakeGoogle'

/**
 * Google-backend e2e setup: mounts the google-drive-api-mock emulator behind
 * `page.route` and seeds real state per scenario, replacing the old
 * hand-written response stubs. Every Drive/Sheets call the app makes hits an
 * emulator with actual files behind it — tests can seed by writing files
 * into `rootDir` and assert by reading them back.
 */

/** Wizard-created artifacts get these well-known ids via `assignId`. */
const MOCK_SPREADSHEET_ID = 'e2eMockSpreadsheetId'
const MOCK_FOLDER_ID = 'e2eMockFolderId'

export type PasteFolderMockMode =
  | 'off'
  | 'ok'
  | 'not_shop'
  | 'bad_version'
  | 'bad_headers'

export type DriveApisMockOptions = {
  /**
   * When not `off`, seeds a folder (under the id the specs paste into
   * `#wizard-folder-id`) for `validateShopFolder`: metadata file +
   * spreadsheet with header rows, deformed per mode.
   */
  pasteFolderMode?: PasteFolderMockMode
}

/** Folder ids the wizard paste-ID specs type, one seeded per mode. */
export const PASTE_FOLDER_IDS: Record<
  Exclude<PasteFolderMockMode, 'off'>,
  string
> = {
  ok: 'e2ePasteFolder1',
  not_shop: 'notAShopFolder',
  bad_version: 'oldVersionFolder',
  bad_headers: 'badHeadersFolder',
}

export interface SeedShopOptions {
  folderId: string
  spreadsheetId: string
  folderName?: string
  version?: string
  /** Per-sheet header overrides (defaults to the canonical SHEET_HEADERS). */
  headers?: Partial<Record<SheetName, string[]>>
}

/** Seed a complete shop folder: workbook with header rows + metadata file. */
export function seedShopFolder(
  fake: FakeGoogleMount,
  options: SeedShopOptions
): void {
  fake.store.createFile({
    id: options.folderId,
    name: options.folderName ?? 'illo3d',
    mimeType: FOLDER_MIME,
  })
  fake.store.createFile({
    id: options.spreadsheetId,
    name: SPREADSHEET_NAME,
    mimeType: SPREADSHEET_MIME,
    parents: [options.folderId],
  })
  for (const sheet of SHEET_NAMES) {
    fake.store.addTab(options.spreadsheetId, sheet)
    const header = options.headers?.[sheet] ?? [...SHEET_HEADERS[sheet]]
    fake.store.setValuesRect(options.spreadsheetId, sheet, 0, 0, [header])
  }
  fake.store.createFile({
    name: METADATA_FILE_NAME,
    mimeType: 'application/json',
    parents: [options.folderId],
    content:
      JSON.stringify(
        {
          app: 'illo3d',
          version: options.version ?? APP_VERSION,
          spreadsheetId: options.spreadsheetId,
          createdAt: '2025-01-01T00:00:00.000Z',
          createdBy: 'e2e',
        },
        null,
        2
      ) + '\n',
  })
}

export async function mockDriveApis(
  page: Page,
  options: DriveApisMockOptions = {}
): Promise<FakeGoogleMount> {
  const fake: FakeGoogleMount = await mountFakeGoogle(page, {
    // First wizard-created folder/spreadsheet get the well-known mock ids
    // (shop-persistence asserts the persisted spreadsheetId); everything
    // else falls back to deterministic `fake-<n>` ids. Seeded files pass
    // explicit ids and never reach this hook.
    assignId: (file) => {
      if (
        file.mimeType === FOLDER_MIME &&
        fake.store.get(MOCK_FOLDER_ID) === undefined
      ) {
        return MOCK_FOLDER_ID
      }
      if (
        file.mimeType === SPREADSHEET_MIME &&
        fake.store.get(MOCK_SPREADSHEET_ID) === undefined
      ) {
        return MOCK_SPREADSHEET_ID
      }
      return undefined
    },
  })

  const mode = options.pasteFolderMode ?? 'off'
  if (mode === 'ok') {
    seedShopFolder(fake, {
      folderId: PASTE_FOLDER_IDS.ok,
      spreadsheetId: 'e2ePasteSpreadsheet1',
    })
  } else if (mode === 'not_shop') {
    // A real folder that simply is not a shop: no metadata file inside.
    fake.store.createFile({
      id: PASTE_FOLDER_IDS.not_shop,
      name: 'not-a-shop',
      mimeType: FOLDER_MIME,
    })
  } else if (mode === 'bad_version') {
    seedShopFolder(fake, {
      folderId: PASTE_FOLDER_IDS.bad_version,
      spreadsheetId: 'e2eOldSpreadsheet1',
      version: '1.0.0',
    })
  } else if (mode === 'bad_headers') {
    seedShopFolder(fake, {
      folderId: PASTE_FOLDER_IDS.bad_headers,
      spreadsheetId: 'e2eBadHeadersSpreadsheet1',
      headers: { clients: ['not-a-real-header'] },
    })
  }

  return fake
}

export { MOCK_SPREADSHEET_ID, MOCK_FOLDER_ID }
