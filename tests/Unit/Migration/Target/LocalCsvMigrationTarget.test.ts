import { describe, expect, it, vi } from 'vitest'
import { METADATA_FILE_NAME, SHEET_HEADERS } from '@/Config/schema'
import { createLocalCsvMigrationTarget } from '@/Migration/Target/LocalCsvMigrationTarget'
import { parseCsv, serializeCsv } from '@/Repository/LocalCsv/Csv'
import {
  FakeDirectoryHandle,
  FixedClock,
  shopMetadata,
  v1Header,
} from '../helpers'

vi.mock('@/Repository/LocalCsv/LocalCsvFolderRepository', async () => {
  const { FakeLocalCsvFolderRepository } = await import('../helpers')
  return { LocalCsvFolderRepository: FakeLocalCsvFolderRepository }
})

const CLOCK = new FixedClock('2026-07-16T10:00:00.000Z')
const BACKUP_DIR = '2026-07-16.v1.5.0.backup'

/** A v1 local shop: one CSV per data sheet (no audit_log.csv) plus metadata. */
function v1Shop(): FakeDirectoryHandle {
  const source = new FakeDirectoryHandle('my-shop')
  source.files.set(
    'clients.csv',
    serializeCsv([
      v1Header('clients'),
      ['CL1', 'Ana', '', '', '', '', '', '', '2024-01-01'],
    ])
  )
  source.files.set('tags.csv', serializeCsv([v1Header('tags')]))
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
  it('writePreUpgradeBackup snapshots the source shop into a sibling folder', async () => {
    const source = v1Shop()
    await target(source).writePreUpgradeBackup()
    const backup = source.dirs.get(BACKUP_DIR)!
    expect(backup).toBeDefined()
    expect(backup.files.get('clients.csv')).toBe(source.files.get('clients.csv'))
  })

  it('openSession loads sheets into memory without touching source files', async () => {
    const source = v1Shop()
    const session = await target(source).openSession()
    expect(session.ctx.backend).toBe('local-csv')
    await session.ctx.ensureSheet('audit_log')
    expect(source.files.has('audit_log.csv')).toBe(false)
    await session.ctx.repo.replaceSheetMatrix(
      session.ctx.workingWorkbookId,
      'tags',
      [[...SHEET_HEADERS.tags]]
    )
    expect(parseCsv(source.files.get('tags.csv')!)).toEqual([
      v1Header('tags'),
    ])
  })

  it('submit publishes in-memory sheets and flips metadata last', async () => {
    const source = v1Shop()
    const originalClients = source.files.get('clients.csv')!
    await target(source).writePreUpgradeBackup()
    const session = await target(source).openSession()
    await session.ctx.repo.replaceSheetMatrix(
      session.ctx.workingWorkbookId,
      'clients',
      [[...SHEET_HEADERS.clients]]
    )

    await session.submit({ keepOriginalAsBackup: true })

    const backup = source.dirs.get(BACKUP_DIR)!
    expect(backup.files.get('clients.csv')).toBe(originalClients)
    expect(source.files.get('clients.csv')).not.toBe(originalClients)
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '3.0.0'
    )
  })

  it('submit without a prior backup when the user skipped it', async () => {
    const source = v1Shop()
    const session = await target(source).openSession()
    await session.submit({ keepOriginalAsBackup: false })
    expect(source.dirs.has(BACKUP_DIR)).toBe(false)
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '3.0.0'
    )
  })

  it('publishes the audit_log.csv the migration created in the session', async () => {
    const source = v1Shop()
    const session = await target(source).openSession()
    await session.ctx.ensureSheet('audit_log')
    await session.submit({ keepOriginalAsBackup: false })
    expect(parseCsv(source.files.get('audit_log.csv')!)).toEqual([
      [...SHEET_HEADERS.audit_log],
    ])
  })

  it('rejects submit before flipping anything when the source metadata is missing', async () => {
    const source = v1Shop()
    const session = await target(source).openSession()
    source.files.delete(METADATA_FILE_NAME)

    await expect(
      session.submit({ keepOriginalAsBackup: false })
    ).rejects.toThrow(/illo3d\.metadata\.json/)
    expect(source.files.has(METADATA_FILE_NAME)).toBe(false)
  })
})
