import { describe, expect, it, vi } from 'vitest'
import { SHEET_HEADERS, SHEET_NAMES, type SheetName } from '@/Config/schema'
import { APP_VERSION } from '@/Config/version'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import type { MetadataReadOutcome } from '@/Repository/MetadataReadOutcome'
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

function makeFolderRepo(outcome: MetadataReadOutcome): FolderRepositoryInterface {
  return {
    readMetadata: vi.fn(async () => outcome),
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
    const service = new ShopValidationService(
      makeFolderRepo({ kind: 'absent' }),
      makeWorkbookRepo()
    )
    expect(await service.validateShopFolder('folder-1')).toEqual({ ok: false, error: 'not_shop' })
  })

  it('returns version_behind for a shop major behind the app', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ kind: 'present', metadata: { ...metadata, version: '2.4.0' } }),
      makeWorkbookRepo(),
    )
    expect(await service.validateShopFolder('folder-1')).toEqual({
      ok: false,
      error: 'version_behind',
      shopVersion: '2.4.0',
      appVersion: APP_VERSION,
    })
  })

  it('returns version_ahead for a shop major ahead of the app', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ kind: 'present', metadata: { ...metadata, version: '4.0.0' } }),
      makeWorkbookRepo(),
    )
    expect(await service.validateShopFolder('folder-1')).toEqual({
      ok: false,
      error: 'version_ahead',
      shopVersion: '4.0.0',
      appVersion: APP_VERSION,
    })
  })

  it('returns version_unreadable for an unparseable shop version', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ kind: 'present', metadata: { ...metadata, version: 'garbage' } }),
      makeWorkbookRepo(),
    )
    const result = await service.validateShopFolder('folder-1')
    expect(result).toMatchObject({
      ok: false,
      error: 'version_unreadable',
      shopVersion: 'garbage',
    })
  })

  it('opens when majors match even if minor and patch differ', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({
        kind: 'present',
        metadata: { ...metadata, version: `${APP_VERSION.split('.')[0]}.9.9` },
      }),
      makeWorkbookRepo(),
    )
    expect(await service.validateShopFolder('folder-1')).toMatchObject({ ok: true })
  })

  it('returns structure with the detail from validateStructure', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ kind: 'present', metadata }),
      makeWorkbookRepo({ sheetNames: [...SHEET_NAMES].filter((name) => name !== 'lots') }),
    )
    expect(await service.validateShopFolder('folder-1')).toEqual({
      ok: false,
      error: 'structure',
      detail: "missing sheet 'lots'",
    })
  })

  it('returns the shop and metadata when everything checks out', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ kind: 'present', metadata }),
      makeWorkbookRepo()
    )
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

  it('returns structure when metadata is damaged', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({
        kind: 'damaged',
        detail: 'metadata file is not valid JSON',
      }),
      makeWorkbookRepo()
    )
    expect(await service.validateShopFolder('folder-1')).toEqual({
      ok: false,
      error: 'structure',
      detail: 'metadata file is not valid JSON',
    })
  })
})

describe('validateStructure', () => {
  it('accepts the canonical workbook', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ kind: 'present', metadata }),
      makeWorkbookRepo()
    )
    expect(await service.validateStructure('wb-1')).toEqual({ ok: true })
  })

  it('names the first missing sheet', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ kind: 'present', metadata }),
      makeWorkbookRepo({ sheetNames: ['clients'] }),
    )
    expect(await service.validateStructure('wb-1')).toEqual({
      ok: false,
      detail: "missing sheet 'crm_notes'",
    })
  })

  it('names the first offending column on a header mismatch', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ kind: 'present', metadata }),
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
      makeFolderRepo({ kind: 'present', metadata }),
      makeWorkbookRepo({ headers: { jobs: [...SHEET_HEADERS.jobs].slice(0, -1) } }),
    )
    expect(await service.validateStructure('wb-1')).toEqual({
      ok: false,
      detail: `sheet 'jobs' column ${SHEET_HEADERS.jobs.length}: expected 'due_date', found ''`,
    })
  })

  it('rejects headers with extra trailing columns', async () => {
    const service = new ShopValidationService(
      makeFolderRepo({ kind: 'present', metadata }),
      makeWorkbookRepo({ headers: { tags: [...SHEET_HEADERS.tags, 'extra'] } }),
    )
    expect(await service.validateStructure('wb-1')).toEqual({
      ok: false,
      detail: `sheet 'tags' column ${SHEET_HEADERS.tags.length + 1}: expected '', found 'extra'`,
    })
  })
})
