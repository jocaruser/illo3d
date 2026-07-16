import { describe, expect, it, vi } from 'vitest'
import { METADATA_FILE_NAME, SHEET_HEADERS } from '@/Config/schema'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import { createLocalCsvMigrationTarget } from '@/Migration/Target/LocalCsvMigrationTarget'
import {
  decodeSheet,
  encodeSheet,
  FakeDirectoryHandle,
  FixedClock,
  shopMetadata,
  v1Header,
} from '../helpers'

vi.mock('@/Repository/LocalCsv/LocalCsvWorkbookRepository', async () => {
  const { FakeLocalCsvWorkbookRepository } = await import('../helpers')
  return { LocalCsvWorkbookRepository: FakeLocalCsvWorkbookRepository }
})

vi.mock('@/Repository/LocalCsv/LocalCsvFolderRepository', async () => {
  const { FakeLocalCsvFolderRepository } = await import('../helpers')
  return { LocalCsvFolderRepository: FakeLocalCsvFolderRepository }
})

const CLOCK = new FixedClock('2026-07-16T10:00:00.000Z')
const WORKING_DIR = '2026-07-16.v1.5.0.v3.0.0.migration'
const BACKUP_DIR = '2026-07-16.v1.5.0.backup'

/** A v1 local shop: one CSV per data sheet (no audit_log.csv) plus metadata. */
function v1Shop(): FakeDirectoryHandle {
  const source = new FakeDirectoryHandle('my-shop')
  source.files.set(
    'clients.csv',
    encodeSheet([
      v1Header('clients'),
      ['CL1', 'Ana', '', '', '', '', '', '', '2024-01-01'],
    ])
  )
  source.files.set('tags.csv', encodeSheet([v1Header('tags')]))
  source.files.set(METADATA_FILE_NAME, JSON.stringify(shopMetadata('1.5.0')))
  return source
}

function target(source: FakeDirectoryHandle) {
  return createLocalCsvMigrationTarget(
    source.asHandle(),
    '1.5.0',
    '3.0.0',
    CLOCK
  )
}

describe('createLocalCsvMigrationTarget', () => {
  it('creates a dated working subdirectory with copies of every shop file', async () => {
    const source = v1Shop()
    const working = await target(source).createWorkingCopy()

    const workingDir = source.dirs.get(WORKING_DIR)!
    expect(workingDir).toBeDefined()
    expect([...workingDir.files.keys()].sort()).toEqual(
      ['clients.csv', 'tags.csv', METADATA_FILE_NAME].sort()
    )
    expect(workingDir.files.get('clients.csv')).toBe(
      source.files.get('clients.csv')
    )
    expect(working.ctx.backend).toBe('local-csv')
    expect(working.ctx.workingWorkbookId).toBe(`local-${WORKING_DIR}`)
  })

  it('binds the context repo and ensureSheet to the working copy only', async () => {
    const source = v1Shop()
    const working = await target(source).createWorkingCopy()

    await working.ctx.ensureSheet('audit_log')
    const matrix = await working.ctx.repo.readSheetMatrix(
      working.ctx.workingWorkbookId,
      'audit_log'
    )
    expect(matrix).toEqual([[...SHEET_HEADERS.audit_log]])
    expect(source.dirs.get(WORKING_DIR)!.files.has('audit_log.csv')).toBe(true)
    expect(source.files.has('audit_log.csv')).toBe(false)

    await working.ctx.repo.replaceSheetMatrix(
      working.ctx.workingWorkbookId,
      'tags',
      [[...SHEET_HEADERS.tags]]
    )
    expect(decodeSheet(source.files.get('tags.csv')!)).toEqual([
      v1Header('tags'),
    ])
  })

  it('commits with a backup: snapshots the original, publishes CSVs, flips metadata last', async () => {
    const source = v1Shop()
    const originalClients = source.files.get('clients.csv')!
    const working = await target(source).createWorkingCopy()
    const migratedClients = encodeSheet([[...SHEET_HEADERS.clients]])
    source.dirs.get(WORKING_DIR)!.files.set('clients.csv', migratedClients)

    await working.commit({ keepOriginalAsBackup: true })

    const backup = source.dirs.get(BACKUP_DIR)!
    expect(backup).toBeDefined()
    expect(backup.files.get('clients.csv')).toBe(originalClients)
    expect(JSON.parse(backup.files.get(METADATA_FILE_NAME)!).version).toBe(
      '1.5.0'
    )

    expect(source.files.get('clients.csv')).toBe(migratedClients)
    const metadata = JSON.parse(
      source.files.get(METADATA_FILE_NAME)!
    ) as ShopMetadata
    expect(metadata.version).toBe('3.0.0')
    expect(metadata.logo).toBe('logo.png')
    expect(metadata.spreadsheetId).toBe('sheet-1')
    expect(source.dirs.has(WORKING_DIR)).toBe(false)
  })

  it('commits without a backup when the user skipped it', async () => {
    const source = v1Shop()
    const working = await target(source).createWorkingCopy()
    await working.commit({ keepOriginalAsBackup: false })
    expect(source.dirs.has(BACKUP_DIR)).toBe(false)
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '3.0.0'
    )
    expect(source.dirs.has(WORKING_DIR)).toBe(false)
  })

  it('publishes the audit_log.csv the migration created in the working copy', async () => {
    const source = v1Shop()
    const working = await target(source).createWorkingCopy()
    await working.ctx.ensureSheet('audit_log')
    await working.commit({ keepOriginalAsBackup: false })
    expect(decodeSheet(source.files.get('audit_log.csv')!)).toEqual([
      [...SHEET_HEADERS.audit_log],
    ])
  })

  it('rejects the commit before flipping anything when the source metadata is missing', async () => {
    const source = v1Shop()
    const working = await target(source).createWorkingCopy()
    source.files.delete(METADATA_FILE_NAME)

    await expect(
      working.commit({ keepOriginalAsBackup: false })
    ).rejects.toThrow(/illo3d\.metadata\.json/)
    expect(source.files.has(METADATA_FILE_NAME)).toBe(false)
    expect(source.dirs.has(WORKING_DIR)).toBe(true)
  })
})
