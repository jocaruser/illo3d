import type { Page } from '@playwright/test'
import { FOLDER_MIME, SPREADSHEET_MIME } from 'google-drive-api-mock'
import {
  SHEET_NAMES,
  SHEET_HEADERS,
  type SheetName,
} from '../../../src/Config/schema'
import { APP_VERSION } from '../../../src/Config/version'
import { resetGoogleMock, type FakeGoogleMount } from './fakeGoogle'

export type PasteFolderMockMode = 'off' | 'ok' | 'not_shop' | 'bad_version' | 'bad_headers'

export type DriveApisMockOptions = {
  /**
   * When not `off`, seeds an existing shop folder for `validateShopFolder`
   * (paste ID / picker): metadata file + spreadsheet with header rows.
   */
  pasteFolderMode?: PasteFolderMockMode
}

/** Deterministic folder ids for every seeded paste-folder scenario. */
export const PASTE_FOLDER_IDS: Record<Exclude<PasteFolderMockMode, 'off'>, string> = {
  ok: 'e2ePasteFolder1',
  not_shop: 'notAShopFolder',
  bad_version: 'oldVersionFolder',
  bad_headers: 'badHeadersFolder',
}

/** The seeded shop's source spreadsheet id — fixed so scenarios can assert against it. */
const SEEDED_SPREADSHEET_ID = 'e2eOldSpreadsheet1'

export interface SeedShopOptions {
  folderId: string
  /** `illo3d.metadata.json`'s `version` field. Defaults to `APP_VERSION`. */
  version?: string
  /** Per-sheet header row override (e.g. to seed a validation failure). */
  headers?: Partial<Record<SheetName, string[]>>
}

/**
 * Seed a complete shop folder — metadata file + spreadsheet with every
 * sheet's header row — directly on the emulator's `DriveStore`, the way an
 * e2e scenario seeds state instead of writing a new per-endpoint stub.
 */
export function seedShopFolder(fake: FakeGoogleMount, options: SeedShopOptions): void {
  const { store } = fake
  const { folderId, version = APP_VERSION, headers } = options
  const headerFor = (sheet: SheetName): string[] => headers?.[sheet] ?? [...SHEET_HEADERS[sheet]]

  store.createFile({ id: folderId, name: 'E2E Folder', mimeType: FOLDER_MIME })
  store.createFile({
    id: SEEDED_SPREADSHEET_ID,
    name: 'illo3d-data',
    mimeType: SPREADSHEET_MIME,
    parents: [folderId],
  })
  for (const sheet of SHEET_NAMES) {
    store.addTab(SEEDED_SPREADSHEET_ID, sheet)
    store.setValuesRect(SEEDED_SPREADSHEET_ID, sheet, 0, 0, [headerFor(sheet)])
  }
  store.createFile({
    name: 'illo3d.metadata.json',
    mimeType: 'application/json',
    parents: [folderId],
    content: JSON.stringify({
      app: 'illo3d',
      version,
      spreadsheetId: SEEDED_SPREADSHEET_ID,
      createdAt: '2025-01-01T00:00:00.000Z',
      createdBy: 'e2e',
    }),
  })
}

/**
 * Point the app at the live `google-mock` double for this test: reset its
 * shared data directory, then, per `options.pasteFolderMode`, seed an
 * existing shop folder exactly as each mode needs it — `not_shop`: a folder
 * with no metadata file inside; `bad_version`: a stale major version;
 * `bad_headers`: a deformed `clients` header row. `off` seeds nothing, so the
 * wizard's "create new shop" flow exercises the live service's own
 * deterministic auto-ids from a clean slate.
 */
export async function mockDriveApis(
  _page: Page,
  options: DriveApisMockOptions = {},
): Promise<FakeGoogleMount> {
  const fake = resetGoogleMock()
  const pasteMode = options.pasteFolderMode ?? 'off'
  if (pasteMode === 'off') return fake

  const folderId = PASTE_FOLDER_IDS[pasteMode]
  if (pasteMode === 'not_shop') {
    fake.store.createFile({ id: folderId, name: 'E2E Folder', mimeType: FOLDER_MIME })
    return fake
  }
  if (pasteMode === 'bad_version') {
    seedShopFolder(fake, { folderId, version: '1.0.0' })
    return fake
  }
  if (pasteMode === 'bad_headers') {
    seedShopFolder(fake, { folderId, headers: { clients: ['not-a-real-header'] } })
    return fake
  }
  seedShopFolder(fake, { folderId })
  return fake
}

export const MOCK_FOLDER_ID = 'fake-1'
export const MOCK_SPREADSHEET_ID = 'fake-2'
