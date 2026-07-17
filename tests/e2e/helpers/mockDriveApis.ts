import type { Page, Route } from '@playwright/test'
import {
  SHEET_NAMES,
  SHEET_HEADERS,
  type SheetName,
} from '../../../src/Config/schema'
import { APP_VERSION } from '../../../src/Config/version'

const MOCK_SPREADSHEET_ID = 'e2eMockSpreadsheetId'
const MOCK_FOLDER_ID = 'e2eMockFolderId'
const MOCK_METADATA_DRIVE_FILE_ID = 'e2eMetadataDriveFile'

export type PasteFolderMockMode = 'off' | 'ok' | 'not_shop' | 'bad_version' | 'bad_headers'

export type DriveApisMockOptions = {
  /**
   * When not `off`, seeds an existing shop folder for `validateShopFolder`
   * (paste ID / picker): metadata file + spreadsheet with header rows.
   */
  pasteFolderMode?: PasteFolderMockMode
}

function isSheetsValues(url: URL): boolean {
  return (
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

function isSheetsBatchUpdate(url: URL, method: string): boolean {
  return (
    method === 'POST' &&
    url.hostname === 'sheets.googleapis.com' &&
    url.pathname.endsWith(':batchUpdate')
  )
}

function isDriveFileCreate(url: URL, method: string): boolean {
  return (
    method === 'POST' &&
    url.hostname === 'www.googleapis.com' &&
    url.pathname === '/drive/v3/files'
  )
}

function isDriveCopy(url: URL, method: string): boolean {
  return (
    method === 'POST' &&
    url.hostname === 'www.googleapis.com' &&
    /^\/drive\/v3\/files\/[^/]+\/copy$/.test(url.pathname)
  )
}

function isDriveUpload(url: URL, method: string): boolean {
  return (
    (method === 'POST' || method === 'PATCH') &&
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

function isDriveDelete(url: URL, method: string): boolean {
  return (
    method === 'DELETE' &&
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

function isDriveFileFieldsGet(url: URL, method: string, field: string): boolean {
  return (
    method === 'GET' &&
    url.hostname === 'www.googleapis.com' &&
    /^\/drive\/v3\/files\//.test(url.pathname) &&
    url.searchParams.get('fields') === field &&
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

/** Extract the content part (second part) of an `uploadMultipart` body. */
function multipartContent(body: string): string | null {
  const parts = body.split(/--illo3d-multipart(?:--)?/)
  const nonEmpty = parts.map((p) => p.trim()).filter((p) => p !== '')
  if (nonEmpty.length < 2) return null
  const sections = nonEmpty[1].split(/\r?\n\r?\n/)
  return sections.slice(1).join('\n\n').trim()
}

function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

/**
 * A stateful in-memory fake of the Drive v3 + Sheets v4 surface the app uses:
 * wizard "Create new shop" (create folder → create spreadsheet → move file →
 * multipart metadata upload), hydration reads, and `validateShopFolder`
 * (metadata search + `alt=media` download, per-sheet header validation).
 *
 * Requests to these hosts are never allowed through to the network — anything
 * unhandled is answered 404 so a missing stub fails fast instead of hanging.
 */
export async function mockDriveApis(
  page: Page,
  options: DriveApisMockOptions = {},
): Promise<void> {
  const pasteMode: PasteFolderMockMode = options.pasteFolderMode ?? 'off'
  const seeded = pasteMode === 'ok' || pasteMode === 'bad_version' || pasteMode === 'bad_headers'

  /** Written spreadsheet cells, keyed `${spreadsheetId}:${sheet}`. */
  const matrices = new Map<string, string[][]>()
  /** The `illo3d.metadata.json` file body, when the folder has one. */
  let metadataJson: string | null = seeded
    ? JSON.stringify({
        app: 'illo3d',
        version: pasteMode === 'bad_version' ? '1.0.0' : APP_VERSION,
        spreadsheetId: MOCK_SPREADSHEET_ID,
        createdAt: '2025-01-01T00:00:00.000Z',
        createdBy: 'e2e',
      })
    : null

  const headerRowFor = (sheet: SheetName): string[] =>
    pasteMode === 'bad_headers' && sheet === 'clients'
      ? ['not-a-real-header']
      : [...SHEET_HEADERS[sheet]].map(String)

  const matrixKey = (url: URL, sheet: SheetName): string => {
    const m = url.pathname.match(/\/v4\/spreadsheets\/([^/]+)\//)
    return `${m?.[1] ?? MOCK_SPREADSHEET_ID}:${sheet}`
  }

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
        if (q.includes('illo3d.metadata.json') && metadataJson !== null) {
          await json(route, {
            files: [{ id: MOCK_METADATA_DRIVE_FILE_ID, name: 'illo3d.metadata.json' }],
          })
          return
        }
        await json(route, { files: [] })
        return
      }

      if (isDriveFileAltMedia(url, method)) {
        const id = url.pathname.split('/').pop()
        if (id === MOCK_METADATA_DRIVE_FILE_ID && metadataJson !== null) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: metadataJson,
          })
          return
        }
        await json(route, { error: `no such file: ${id}` }, 404)
        return
      }

      if (isDriveFileFieldsGet(url, method, 'name')) {
        await json(route, { name: 'E2E Folder' })
        return
      }

      if (isDriveFileFieldsGet(url, method, 'parents')) {
        await json(route, { parents: [] })
        return
      }

      if (isSheetsCreatePost(url, method)) {
        await json(route, { spreadsheetId: MOCK_SPREADSHEET_ID })
        return
      }

      if (isSheetsValues(url)) {
        const sheet = parseSheetFromValuesUrl(url)
        if (sheet === null) {
          await json(route, { error: `unknown sheet range: ${url.pathname}` }, 404)
          return
        }
        const key = matrixKey(url, sheet)

        // `writeValues` (PUT ...!A1?valueInputOption=RAW) replaces from A1.
        if (method === 'PUT') {
          const raw = req.postData() ?? '{}'
          const payload = JSON.parse(raw) as { values?: string[][] }
          matrices.set(key, payload.values ?? [])
          await json(route, {})
          return
        }
        // `replaceSheetMatrix` clears first (POST ...!A:ZZ:clear).
        if (method === 'POST' && url.pathname.endsWith(':clear')) {
          matrices.delete(key)
          await json(route, {})
          return
        }
        if (method === 'GET') {
          const stored = matrices.get(key)
          const matrix = stored ?? (seeded ? [headerRowFor(sheet)] : [])
          if (isHeaderRowOnlyRange(url)) {
            await json(route, { values: matrix.length > 0 ? [matrix[0]] : [] })
            return
          }
          await json(route, { values: matrix })
          return
        }
        await json(route, { error: `unhandled values ${method}` }, 404)
        return
      }

      if (isSheetsBatchUpdate(url, method)) {
        await json(route, {})
        return
      }

      if (isSheetsMetaGet(url, method)) {
        const sheets = SHEET_NAMES.map((title, i) => ({
          properties: { sheetId: i + 1, title },
        }))
        await json(route, { sheets })
        return
      }

      if (isDriveCopy(url, method)) {
        const sourceId = url.pathname.split('/')[4]
        await json(route, { id: `e2eCopyOf-${sourceId}` })
        return
      }

      if (isDriveFileCreate(url, method)) {
        const raw = req.postData()
        let name = 'illo3d'
        try {
          const parsed = raw ? (JSON.parse(raw) as { name?: string }) : {}
          if (typeof parsed.name === 'string') name = parsed.name
        } catch {
          // keep the default name
        }
        await json(route, { id: MOCK_FOLDER_ID, name })
        return
      }

      if (isDriveUpload(url, method)) {
        const content = multipartContent(req.postData() ?? '')
        if (content !== null) metadataJson = content
        await json(route, { id: MOCK_METADATA_DRIVE_FILE_ID })
        return
      }

      if (isDrivePatch(url, method) || isDriveDelete(url, method)) {
        await json(route, {})
        return
      }

      await json(route, { error: `unhandled Google API request: ${method} ${url.href}` }, 404)
    },
  )
}

export { MOCK_SPREADSHEET_ID, MOCK_FOLDER_ID }
