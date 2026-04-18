import type { Page, Route } from '@playwright/test'
import {
  SHEET_NAMES,
  SHEET_HEADERS,
  type SheetName,
} from '../../../src/services/sheets/config'

const MOCK_SPREADSHEET_ID = 'e2eMockSpreadsheetId'
const MOCK_FOLDER_ID = 'e2eMockFolderId'
const MOCK_METADATA_DRIVE_FILE_ID = 'e2eMetadataDriveFile'

export type PasteFolderMockMode = 'off' | 'ok' | 'not_shop' | 'bad_version' | 'bad_headers'

export type DriveApisMockOptions = {
  /**
   * When not `off`, stubs Drive metadata list + media for `validateShopFolder` (paste ID / picker).
   */
  pasteFolderMode?: PasteFolderMockMode
}

function isSheetsValuesGet(url: URL, method: string): boolean {
  return (
    method === 'GET' &&
    url.hostname === 'sheets.googleapis.com' &&
    url.pathname.includes('/v4/spreadsheets/') &&
    url.pathname.includes('/values/')
  )
}

function isSheetsMetaGet(url: URL, method: string): boolean {
  return (
    method === 'GET' &&
    url.hostname === 'sheets.googleapis.com' &&
    url.pathname.includes('/v4/spreadsheets/') &&
    !url.pathname.includes('/values/') &&
    url.searchParams.has('fields')
  )
}

function isSheetsCreatePost(url: URL, method: string): boolean {
  return (
    method === 'POST' &&
    url.hostname === 'sheets.googleapis.com' &&
    url.pathname === '/v4/spreadsheets'
  )
}

function isDriveFolderCreate(url: URL, method: string): boolean {
  if (url.hostname !== 'www.googleapis.com') return false
  if (method !== 'POST') return false
  if (!url.pathname.startsWith('/drive/v3/files')) return false
  if (url.pathname.includes('/upload')) return false
  return true
}

function isDriveUpload(url: URL, method: string): boolean {
  return (
    method === 'POST' &&
    url.hostname === 'www.googleapis.com' &&
    url.pathname.startsWith('/upload/drive/v3/files')
  )
}

function isDrivePatch(url: URL, method: string): boolean {
  return (
    method === 'PATCH' &&
    url.hostname === 'www.googleapis.com' &&
    /^\/drive\/v3\/files\/[^/]+/.test(url.pathname)
  )
}

function isDriveFilesList(url: URL, method: string): boolean {
  return (
    method === 'GET' &&
    url.hostname === 'www.googleapis.com' &&
    url.pathname === '/drive/v3/files' &&
    url.searchParams.has('q')
  )
}

function isDriveFileAltMedia(url: URL, method: string): boolean {
  return (
    method === 'GET' &&
    url.hostname === 'www.googleapis.com' &&
    /^\/drive\/v3\/files\//.test(url.pathname) &&
    url.searchParams.get('alt') === 'media'
  )
}

function isDriveFileNameField(url: URL, method: string): boolean {
  return (
    method === 'GET' &&
    url.hostname === 'www.googleapis.com' &&
    /^\/drive\/v3\/files\//.test(url.pathname) &&
    url.searchParams.get('fields') === 'name' &&
    url.searchParams.get('alt') !== 'media'
  )
}

function parseSheetFromValuesUrl(url: URL): SheetName | null {
  const marker = '/values/'
  const idx = url.pathname.indexOf(marker)
  if (idx === -1) return null
  const enc = url.pathname.slice(idx + marker.length)
  try {
    const range = decodeURIComponent(enc)
    const m = range.match(/^'([^']+)'!/)
    if (!m) return null
    const name = m[1]
    if ((SHEET_NAMES as readonly string[]).includes(name)) {
      return name as SheetName
    }
    return null
  } catch {
    return null
  }
}

/** `getHeaderRow` uses row 1 only (`'Sheet'!1:1`); `readSheetMatrix` uses `'Sheet'!A:ZZ`. */
function isHeaderRowOnlyRange(url: URL): boolean {
  const marker = '/values/'
  const idx = url.pathname.indexOf(marker)
  if (idx === -1) return false
  try {
    const range = decodeURIComponent(url.pathname.slice(idx + marker.length))
    return /!1:1$/.test(range)
  } catch {
    return false
  }
}

/**
 * Stubs Google Drive + Sheets for wizard "Create new shop", hydrate reads, and optional
 * `validateShopFolder` (paste folder ID / picker) flows.
 */
export async function mockDriveApis(
  page: Page,
  options: DriveApisMockOptions = {},
): Promise<void> {
  const pasteMode: PasteFolderMockMode = options.pasteFolderMode ?? 'off'
  const metadataVersion = pasteMode === 'bad_version' ? '2.0.0' : '1.0.0'

  await page.route(
    (url: URL) => {
      if (url.hostname === 'sheets.googleapis.com') return true
      if (url.hostname !== 'www.googleapis.com') return false
      if (url.pathname.startsWith('/drive/v3/')) return true
      if (url.pathname.startsWith('/upload/drive/')) return true
      return false
    },
    async (route: Route) => {
      const req = route.request()
      const url = new URL(req.url())
      const method = req.method()

      if (isDriveFilesList(url, method)) {
        const q = url.searchParams.get('q') ?? ''
        if (!q.includes('illo3d.metadata.json')) {
          await route.continue()
          return
        }
        if (pasteMode === 'off') {
          await route.continue()
          return
        }
        if (pasteMode === 'not_shop') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ files: [] }),
          })
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            files: [{ id: MOCK_METADATA_DRIVE_FILE_ID, name: 'illo3d.metadata.json' }],
          }),
        })
        return
      }

      if (isDriveFileAltMedia(url, method)) {
        const id = url.pathname.split('/').pop()
        if (id !== MOCK_METADATA_DRIVE_FILE_ID) {
          await route.continue()
          return
        }
        if (pasteMode === 'off') {
          await route.continue()
          return
        }
        const metadata = {
          app: 'illo3d',
          version: metadataVersion,
          spreadsheetId: MOCK_SPREADSHEET_ID,
          createdAt: '2025-01-01T00:00:00.000Z',
          createdBy: 'e2e',
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(metadata),
        })
        return
      }

      if (isDriveFileNameField(url, method)) {
        if (pasteMode === 'off') {
          await route.continue()
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ name: 'E2E Folder' }),
        })
        return
      }

      if (isSheetsCreatePost(url, method)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ spreadsheetId: MOCK_SPREADSHEET_ID }),
        })
        return
      }

      if (isSheetsValuesGet(url, method)) {
        const sheetName = parseSheetFromValuesUrl(url)
        const headerRowRequest = Boolean(sheetName && isHeaderRowOnlyRange(url))

        if (pasteMode === 'bad_headers' && sheetName === 'clients' && headerRowRequest) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ values: [['not-a-real-header']] }),
          })
          return
        }
        if (
          (pasteMode === 'ok' || pasteMode === 'bad_headers') &&
          sheetName &&
          headerRowRequest
        ) {
          const row = [...SHEET_HEADERS[sheetName]].map(String)
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ values: [row] }),
          })
          return
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ values: [] }),
        })
        return
      }

      if (isSheetsMetaGet(url, method)) {
        const sheets = SHEET_NAMES.map((title, i) => ({
          properties: { sheetId: i + 1, title },
        }))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ sheets }),
        })
        return
      }

      if (isDriveFolderCreate(url, method)) {
        const raw = req.postData()
        let mime: string | undefined
        let name = 'illo3d'
        try {
          const json = raw ? (JSON.parse(raw) as { mimeType?: string; name?: string }) : {}
          mime = json.mimeType
          if (typeof json.name === 'string') name = json.name
        } catch {
          mime = undefined
        }
        if (mime === 'application/vnd.google-apps.folder') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: MOCK_FOLDER_ID, name }),
          })
          return
        }
      }

      if (isDriveUpload(url, method)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'e2eMockMetadataFileId' }),
        })
        return
      }

      if (isDrivePatch(url, method)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: '{}',
        })
        return
      }

      await route.continue()
    },
  )
}

export { MOCK_SPREADSHEET_ID, MOCK_FOLDER_ID }
