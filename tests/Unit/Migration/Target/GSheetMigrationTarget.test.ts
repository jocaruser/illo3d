import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SHEET_HEADERS, SHEET_NAMES, type SheetName } from '@/Config/schema'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import type { SheetMatrix } from '@/Repository/WorkbookRepositoryInterface'
import { IN_MEMORY_WORKBOOK_ID } from '@/Migration/InMemoryWorkbookRepository'
import { createGSheetMigrationTarget } from '@/Migration/Target/GSheetMigrationTarget'
import { FixedClock, shopMetadata, v1Header } from '../helpers'

const h = vi.hoisted(() => {
  const calls: string[] = []
  /** The source spreadsheet's tabs, mutated only by `persist`. */
  const tabs = new Map<string, string[][]>()
  return {
    calls,
    tabs,
    copyFile: vi.fn(
      async (fileId: string, newName: string, folderId: string) => {
        calls.push(`copyFile:${fileId}:${newName}:${folderId}`)
        return 'backup-id'
      }
    ),
    readMetadata: vi.fn<() => Promise<ShopMetadata | null>>(),
    writeMetadata: vi.fn(async () => {
      calls.push('writeMetadata')
    }),
    getSheetNames: vi.fn(async () => [...tabs.keys()]),
    readSheetMatrix: vi.fn(async (_id: string, sheet: SheetName) => {
      calls.push(`read:${sheet}`)
      return (tabs.get(sheet) ?? []).map((row) => [...row])
    }),
    replaceSheetMatrix: vi.fn(
      async (_id: string, sheet: SheetName, matrix: SheetMatrix) => {
        calls.push(`replace:${sheet}`)
        tabs.set(sheet, matrix)
      }
    ),
    ensureSheet: vi.fn(async (_id: string, sheet: SheetName) => {
      calls.push(`ensure:${sheet}`)
      if (!tabs.has(sheet)) tabs.set(sheet, [[...SHEET_HEADERS[sheet]]])
    }),
  }
})

vi.mock('@/Repository/GSheet/DriveFiles', () => ({
  copyFile: h.copyFile,
}))

vi.mock('@/Repository/GSheet/GDriveFolderRepository', () => ({
  GDriveFolderRepository: class {
    readMetadata = h.readMetadata
    writeMetadata = h.writeMetadata
  },
}))

vi.mock('@/Repository/GSheet/GSheetWorkbookRepository', () => ({
  GSheetWorkbookRepository: class {
    getSheetNames = h.getSheetNames
    readSheetMatrix = h.readSheetMatrix
    replaceSheetMatrix = h.replaceSheetMatrix
    ensureSheet = h.ensureSheet
  },
}))

function makeTarget() {
  return createGSheetMigrationTarget(
    'folder-1',
    'source-sheet',
    '2.0.0',
    '3.0.0',
    new FixedClock('2026-07-16T10:00:00.000Z')
  )
}

/** Seed the fake spreadsheet as a v2 shop: every tab except audit_log. */
function seedV2Tabs(): void {
  h.tabs.clear()
  for (const sheet of SHEET_NAMES) {
    if (sheet === 'audit_log') continue
    h.tabs.set(sheet, [v1Header(sheet)])
  }
  h.tabs.set('jobs', [v1Header('jobs'), ['J1', 'CL1', 'Vase', 'draft', '', '', '']])
}

describe('createGSheetMigrationTarget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.calls.length = 0
    seedV2Tabs()
    h.readMetadata.mockResolvedValue(shopMetadata('2.0.0'))
  })

  it('opens by reading every stored tab once into an in-memory context', async () => {
    const session = await makeTarget().open()

    expect(session.ctx.backend).toBe('google-drive')
    expect(session.ctx.workingWorkbookId).toBe(IN_MEMORY_WORKBOOK_ID)
    expect(
      await session.ctx.repo.readSheetMatrix(IN_MEMORY_WORKBOOK_ID, 'jobs')
    ).toEqual([v1Header('jobs'), ['J1', 'CL1', 'Vase', 'draft', '', '', '']])
    // The absent audit_log tab stays absent in memory too.
    expect(
      await session.ctx.repo.getSheetNames(IN_MEMORY_WORKBOOK_ID)
    ).not.toContain('audit_log')
    // Opening only reads: no copy, no writes, no metadata traffic.
    expect(h.copyFile).not.toHaveBeenCalled()
    expect(h.replaceSheetMatrix).not.toHaveBeenCalled()
    expect(h.writeMetadata).not.toHaveBeenCalled()
  })

  it('keeps step writes and ensured sheets in memory, off the spreadsheet', async () => {
    const session = await makeTarget().open()
    await session.ctx.repo.replaceSheetMatrix(IN_MEMORY_WORKBOOK_ID, 'jobs', [
      [...SHEET_HEADERS.jobs],
    ])
    await session.ctx.ensureSheet('audit_log')

    expect(h.replaceSheetMatrix).not.toHaveBeenCalled()
    expect(h.ensureSheet).not.toHaveBeenCalled()
    expect(h.tabs.get('jobs')![0]).toEqual(v1Header('jobs'))
  })

  it('writes the backup at its own step as a named Drive copy of the source', async () => {
    const session = await makeTarget().open()
    await session.writeBackup()
    expect(h.copyFile).toHaveBeenCalledExactlyOnceWith(
      'source-sheet',
      'illo3d-data.v2.0.0.backup',
      'folder-1'
    )
    // The backup is a copy: the source spreadsheet and metadata are untouched.
    expect(h.replaceSheetMatrix).not.toHaveBeenCalled()
    expect(h.writeMetadata).not.toHaveBeenCalled()
  })

  it('persists in place: rewrites tabs, creates added ones, flips the version last', async () => {
    const session = await makeTarget().open()
    const migratedJobs = [
      [...SHEET_HEADERS.jobs],
      ['J1', 'CL1', 'Vase', 'draft', '', '', '', '', '', ''],
    ]
    await session.ctx.repo.replaceSheetMatrix(
      IN_MEMORY_WORKBOOK_ID,
      'jobs',
      migratedJobs
    )
    await session.ctx.ensureSheet('audit_log')
    h.calls.length = 0

    await session.persist()

    expect(h.tabs.get('jobs')).toEqual(migratedJobs)
    expect(h.tabs.get('audit_log')).toEqual([[...SHEET_HEADERS.audit_log]])
    // Only the tab the migration added is ensured; existing tabs are rewritten.
    expect(h.ensureSheet).toHaveBeenCalledExactlyOnceWith(
      'source-sheet',
      'audit_log'
    )
    expect(h.replaceSheetMatrix).toHaveBeenCalledWith(
      'source-sheet',
      'jobs',
      migratedJobs
    )
    // The atomic commit point: the metadata flip is the very last call.
    expect(h.calls[h.calls.length - 1]).toBe('writeMetadata')
    expect(h.writeMetadata).toHaveBeenCalledExactlyOnceWith('folder-1', {
      ...shopMetadata('2.0.0'),
      version: '3.0.0',
    })
  })

  it('leaves the spreadsheet id untouched — the shop is migrated in place', async () => {
    const session = await makeTarget().open()
    await session.persist()
    const written = h.writeMetadata.mock.calls[0] as unknown[]
    expect((written[1] as ShopMetadata).spreadsheetId).toBe(
      shopMetadata('2.0.0').spreadsheetId
    )
  })

  it('rejects the persist before writing anything when the folder has no metadata', async () => {
    const session = await makeTarget().open()
    h.readMetadata.mockResolvedValue(null)
    await expect(session.persist()).rejects.toThrow(/illo3d\.metadata\.json/)
    expect(h.replaceSheetMatrix).not.toHaveBeenCalled()
    expect(h.ensureSheet).not.toHaveBeenCalled()
    expect(h.writeMetadata).not.toHaveBeenCalled()
  })
})
