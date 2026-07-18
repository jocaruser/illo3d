import { describe, expect, it, vi } from 'vitest'
import { METADATA_FILE_NAME, SHEET_HEADERS } from '@/Config/schema'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import { IN_MEMORY_WORKBOOK_ID } from '@/Migration/InMemoryWorkbookRepository'
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
  it('opens by reading every stored sheet once into an in-memory context', async () => {
    const source = v1Shop()
    const session = await target(source).open()

    expect(session.ctx.backend).toBe('local-csv')
    expect(session.ctx.workingWorkbookId).toBe(IN_MEMORY_WORKBOOK_ID)
    expect(
      (await session.ctx.repo.getSheetNames(IN_MEMORY_WORKBOOK_ID)).sort()
    ).toEqual(['clients', 'tags'])
    expect(
      await session.ctx.repo.readSheetMatrix(IN_MEMORY_WORKBOOK_ID, 'clients')
    ).toEqual([
      v1Header('clients'),
      ['CL1', 'Ana', '', '', '', '', '', '', '2024-01-01'],
    ])
    // Opening writes nothing: no subdirectories, files untouched.
    expect([...source.dirs.keys()]).toEqual([])
  })

  it('keeps step writes and ensured sheets in memory, off the disk', async () => {
    const source = v1Shop()
    const before = new Map(source.files)
    const session = await target(source).open()

    await session.ctx.repo.replaceSheetMatrix(IN_MEMORY_WORKBOOK_ID, 'tags', [
      [...SHEET_HEADERS.tags],
    ])
    await session.ctx.ensureSheet('audit_log')

    expect(
      await session.ctx.repo.readSheetMatrix(IN_MEMORY_WORKBOOK_ID, 'audit_log')
    ).toEqual([[...SHEET_HEADERS.audit_log]])
    expect(new Map(source.files)).toEqual(before)
    expect(source.files.has('audit_log.csv')).toBe(false)
  })

  it('writes the backup at its own step, as the shop currently is', async () => {
    const source = v1Shop()
    const session = await target(source).open()
    // A step has already mutated the in-memory copy; the backup must ignore it.
    await session.ctx.repo.replaceSheetMatrix(IN_MEMORY_WORKBOOK_ID, 'clients', [
      [...SHEET_HEADERS.clients],
    ])

    await session.writeBackup()

    const backup = source.dirs.get(BACKUP_DIR)!
    expect(backup).toBeDefined()
    expect([...backup.files.keys()].sort()).toEqual(
      ['clients.csv', 'tags.csv', METADATA_FILE_NAME].sort()
    )
    expect(backup.files.get('clients.csv')).toBe(source.files.get('clients.csv'))
    expect(JSON.parse(backup.files.get(METADATA_FILE_NAME)!).version).toBe(
      '1.5.0'
    )
  })

  it('persists every in-memory sheet and flips the metadata version last', async () => {
    const source = v1Shop()
    const session = await target(source).open()
    const migratedClients = [[...SHEET_HEADERS.clients]]
    await session.ctx.repo.replaceSheetMatrix(
      IN_MEMORY_WORKBOOK_ID,
      'clients',
      migratedClients
    )
    await session.ctx.ensureSheet('audit_log')

    await session.persist()

    expect(decodeSheet(source.files.get('clients.csv')!)).toEqual(
      migratedClients
    )
    expect(decodeSheet(source.files.get('audit_log.csv')!)).toEqual([
      [...SHEET_HEADERS.audit_log],
    ])
    const metadata = JSON.parse(
      source.files.get(METADATA_FILE_NAME)!
    ) as ShopMetadata
    expect(metadata.version).toBe('3.0.0')
    expect(metadata.logo).toBe('logo.png')
    expect(metadata.spreadsheetId).toBe('sheet-1')
  })

  it('persists without a backup when none was requested', async () => {
    const source = v1Shop()
    const session = await target(source).open()
    await session.persist()
    expect(source.dirs.has(BACKUP_DIR)).toBe(false)
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '3.0.0'
    )
  })

  it('rejects the persist before writing anything when the source metadata is missing', async () => {
    const source = v1Shop()
    const session = await target(source).open()
    await session.ctx.repo.replaceSheetMatrix(IN_MEMORY_WORKBOOK_ID, 'clients', [
      [...SHEET_HEADERS.clients],
    ])
    source.files.delete(METADATA_FILE_NAME)
    const before = new Map(source.files)

    await expect(session.persist()).rejects.toThrow(/illo3d\.metadata\.json/)
    expect(new Map(source.files)).toEqual(before)
  })
})
