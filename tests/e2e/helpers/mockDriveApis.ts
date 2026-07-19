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
import { resetGoogleMock, type FakeGoogleMount } from './fakeGoogle'

/**
 * Google-backend e2e setup: resets the live `google-mock` service's data
 * directory and seeds real state per scenario — no request stubbing anywhere;
 * the app reaches the mock over HTTP because the e2e Vite build points
 * `VITE_GOOGLE_*_API_BASE` at it. Tests seed by writing files into
 * `rootDir` and assert by reading them back.
 */

/**
 * The mock assigns deterministic ids (`fake-<n>`) and every test starts from
 * a reset world, so wizard-created artifacts land on known ids: the shop
 * folder is created first (`fake-1`), the spreadsheet second (`fake-2`).
 * Seeded files always pin explicit ids and never advance the counter.
 */
const MOCK_FOLDER_ID = 'fake-1'
const MOCK_SPREADSHEET_ID = 'fake-2'

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
    id: `${options.folderId}-metadata`,
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
  _page: Page,
  options: DriveApisMockOptions = {}
): Promise<FakeGoogleMount> {
  void _page // the data plane is a real HTTP service; only OAuth needs the page
  const fake = resetGoogleMock()

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
