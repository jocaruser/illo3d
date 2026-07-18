import { describe, expect, it, vi } from 'vitest'
import { SHEET_HEADERS, SHEET_NAMES, type SheetName } from '@/Config/schema'
import { APP_VERSION } from '@/Config/version'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import type { FolderRepositoryInterface } from '@/Repository/FolderRepositoryInterface'
import type { WorkbookRepositoryInterface } from '@/Repository/WorkbookRepositoryInterface'
import { ShopValidationService } from '@/Service/ShopValidationService'

const metadata: ShopMetadata = {
  app: 'illo3d',
  version: '3.0.0',
  spreadsheetId: 'wb-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'user@example.com',
}

function makeFolderRepo(meta: ShopMetadata | null): FolderRepositoryInterface {
  return {
    readMetadata: vi.fn(async () => meta),
    writeMetadata: vi.fn(async () => {}),
    getFolderName: vi.fn(async () => 'My Shop'),
  }
}

function makeWorkbookRepo(overrides?: {
  sheetNames?: string[]
  headers?: Partial<Record<SheetName, string[]>>
}): WorkbookRepositoryInterface {
  return {
    readSheetMatrix: vi.fn(async () => []),
    replaceSheetMatrix: vi.fn(async () => {}),
    getSheetNames: vi.fn(async () => overrides?.sheetNames ?? [...SHEET_NAMES]),
    getHeaderRow: vi.fn(
      async (_workbookId: string, sheet: SheetName) =>
        overrides?.headers?.[sheet] ?? [...SHEET_HEADERS[sheet]],
    ),
    createWorkbook: vi.fn(async () => 'wb-new'),
    ensureSheet: vi.fn(async () => {}),
  }
}

describe('validateShopFolder', () => {
  it('returns not_shop when metadata is missing', async () => {
    const service = new ShopValidationService(makeFolderRepo(null), makeWorkbookRepo())
    expect(await service.validateShopFolder('folder-1')).toEqual({ ok: false, error: 'not_shop' })
  })

  it('returns version for a shop major behind the app (wizard territory)', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ ...metadata, version: '2.4.0' }),
      makeWorkbookRepo(),
    )
    expect(await service.validateShopFolder('folder-1')).toEqual({
      ok: false,
      error: 'version',
      shopVersion: '2.4.0',
      appVersion: APP_VERSION,
    })
  })

  it('returns version_ahead for a shop major ahead of the app', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ ...metadata, version: '9.1.0' }),
      makeWorkbookRepo(),
    )
    expect(await service.validateShopFolder('folder-1')).toEqual({
      ok: false,
      error: 'version_ahead',
      shopVersion: '9.1.0',
      appVersion: APP_VERSION,
    })
  })

  it('returns version_unreadable for an unparseable shop version', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ ...metadata, version: 'garbage' }),
      makeWorkbookRepo(),
    )
    expect(await service.validateShopFolder('folder-1')).toEqual({
      ok: false,
      error: 'version_unreadable',
      shopVersion: 'garbage',
    })
  })

  it('returns structure with the detail from validateStructure', async () => {
    const service = new ShopValidationService(
      makeFolderRepo(metadata),
      makeWorkbookRepo({ sheetNames: [...SHEET_NAMES].filter((name) => name !== 'lots') }),
    )
    expect(await service.validateShopFolder('folder-1')).toEqual({
      ok: false,
      error: 'structure',
      detail: "missing sheet 'lots'",
    })
  })

  it('returns the shop and metadata when everything checks out', async () => {
    const service = new ShopValidationService(makeFolderRepo(metadata), makeWorkbookRepo())
    expect(await service.validateShopFolder('folder-1')).toEqual({
      ok: true,
      shop: {
        folderId: 'folder-1',
        folderName: 'My Shop',
        spreadsheetId: 'wb-1',
        metadataVersion: '3.0.0',
      },
      metadata,
    })
  })
})

describe('validateStructure', () => {
  it('accepts the canonical workbook', async () => {
    const service = new ShopValidationService(makeFolderRepo(metadata), makeWorkbookRepo())
    expect(await service.validateStructure('wb-1')).toEqual({ ok: true })
  })

  it('names the first missing sheet', async () => {
    const service = new ShopValidationService(
      makeFolderRepo(metadata),
      makeWorkbookRepo({ sheetNames: ['clients'] }),
    )
    expect(await service.validateStructure('wb-1')).toEqual({
      ok: false,
      detail: "missing sheet 'crm_notes'",
    })
  })

  it('names the first offending column on a header mismatch', async () => {
    const service = new ShopValidationService(
      makeFolderRepo(metadata),
      makeWorkbookRepo({
        headers: { jobs: SHEET_HEADERS.jobs.map((c) => (c === 'status' ? 'state' : c)) },
      }),
    )
    expect(await service.validateStructure('wb-1')).toEqual({
      ok: false,
      detail: "sheet 'jobs' column 4: expected 'status', found 'state'",
    })
  })

  it('rejects headers missing a trailing column (v2 shop without due_date)', async () => {
    const service = new ShopValidationService(
      makeFolderRepo(metadata),
      makeWorkbookRepo({ headers: { jobs: [...SHEET_HEADERS.jobs].slice(0, -1) } }),
    )
    expect(await service.validateStructure('wb-1')).toEqual({
      ok: false,
      detail: `sheet 'jobs' column ${SHEET_HEADERS.jobs.length}: expected 'due_date', found ''`,
    })
  })

  it('rejects headers with extra trailing columns', async () => {
    const service = new ShopValidationService(
      makeFolderRepo(metadata),
      makeWorkbookRepo({ headers: { tags: [...SHEET_HEADERS.tags, 'extra'] } }),
    )
    expect(await service.validateStructure('wb-1')).toEqual({
      ok: false,
      detail: `sheet 'tags' column ${SHEET_HEADERS.tags.length + 1}: expected '', found 'extra'`,
    })
  })
})
