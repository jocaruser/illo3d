import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DATA_SHEET_NAMES,
  METADATA_FILE_NAME,
  SHEET_HEADERS,
} from '@/Config/schema'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import { runPlans } from '@/Migration/orchestrator'
import { resolvePlanChain } from '@/Migration/registry'
import { createLocalCsvMigrationTarget } from '@/Migration/Target/LocalCsvMigrationTarget'
import { matrixToRecords } from '@/Repository/Matrix'
import { useMigrationStore } from '@/Store/migrationStore'
import {
  decodeSheet,
  encodeSheet,
  FakeDirectoryHandle,
  FixedClock,
  shopMetadata,
  v1Header,
} from './helpers'

vi.mock('@/Repository/LocalCsv/LocalCsvWorkbookRepository', async () => {
  const { FakeLocalCsvWorkbookRepository } = await import('./helpers')
  return { LocalCsvWorkbookRepository: FakeLocalCsvWorkbookRepository }
})

vi.mock('@/Repository/LocalCsv/LocalCsvFolderRepository', async () => {
  const { FakeLocalCsvFolderRepository } = await import('./helpers')
  return { LocalCsvFolderRepository: FakeLocalCsvFolderRepository }
})

const CLOCK = new FixedClock('2026-07-16T10:00:00.000Z')
const BACKUP_DIR = '2026-07-16.v1.5.0.backup'

/** Build a full v1 local shop: every data sheet as a v1-shaped CSV, no audit_log. */
function v1Shop(): FakeDirectoryHandle {
  const source = new FakeDirectoryHandle('my-shop')
  for (const sheet of DATA_SHEET_NAMES) {
    source.files.set(`${sheet}.csv`, encodeSheet([v1Header(sheet)]))
  }
  source.files.set(
    'clients.csv',
    encodeSheet([
      v1Header('clients'),
      ['CL1', 'Ana', 'ana@x.test', '', '', '', '', '', '2024-01-01'],
    ])
  )
  source.files.set(
    'jobs.csv',
    encodeSheet([
      v1Header('jobs'),
      ['J1', 'CL1', 'Vase', 'pending', '25', '1', '2024-01-05'],
    ])
  )
  source.files.set(
    'inventory.csv',
    encodeSheet([
      v1Header('inventory'),
      ['INV1', 'filament', 'PLA', '900', '500', '250', '100', '2024-01-02'],
    ])
  )
  source.files.set(METADATA_FILE_NAME, JSON.stringify(shopMetadata('1.5.0')))
  return source
}

function sheetOf(source: FakeDirectoryHandle, name: string) {
  return decodeSheet(source.files.get(`${name}.csv`)!)
}

function makeTarget(source: FakeDirectoryHandle, fromVersion = '1.5.0') {
  return createLocalCsvMigrationTarget(
    source.asHandle(),
    fromVersion,
    '3.0.0',
    CLOCK
  )
}

describe('chained v1 → v3 migration over a local shop', () => {
  beforeEach(() => {
    useMigrationStore.getState().reset()
  })

  it('runs both plans in memory: the backup lands at its step, nothing else is written', async () => {
    const source = v1Shop()
    const before = new Map(source.files)

    const result = await runPlans(resolvePlanChain(1, 3), makeTarget(source), {
      keepOriginalAsBackup: true,
    })

    expect(result).toMatchObject({ ok: true })
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('ready')
    expect(state.steps.map((step) => step.id)).toEqual([
      'backup',
      'clients',
      'crm_notes',
      'tags',
      'tag_links',
      'jobs',
      'pieces',
      'piece_items',
      'inventory',
      'lots',
      'transactions',
      'audit_log',
    ])
    expect(state.steps.every((step) => step.status === 'done')).toBe(true)

    // The shop itself is untouched — the whole run lived in memory…
    expect(new Map(source.files)).toEqual(before)
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '1.5.0'
    )
    // …except the backup, deliberately written at its own step (ADR-0012):
    // it can outlive an unsubmitted migration.
    const backup = source.dirs.get(BACKUP_DIR)!
    expect(backup).toBeDefined()
    expect(decodeSheet(backup.files.get('jobs.csv')!)[0]).toEqual(
      v1Header('jobs')
    )
    expect(JSON.parse(backup.files.get(METADATA_FILE_NAME)!).version).toBe(
      '1.5.0'
    )
    expect([...source.dirs.keys()]).toEqual([BACKUP_DIR])
  })

  it('persisting the completed run publishes the migrated data and flips 3.0.0', async () => {
    const source = v1Shop()
    const result = await runPlans(
      resolvePlanChain(1, 3),
      makeTarget(source),
      { keepOriginalAsBackup: true }
    )
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')

    await result.session.persist()

    // Every sheet now carries the canonical v3 header, data mapped by position.
    expect(sheetOf(source, 'jobs')).toEqual([
      [...SHEET_HEADERS.jobs],
      ['J1', 'CL1', 'Vase', 'pending', '25', '1', '2024-01-05', '', '', ''],
    ])
    expect(sheetOf(source, 'inventory')[0]).toEqual([
      ...SHEET_HEADERS.inventory,
    ])

    // Audit baseline backfilled for the three seeded rows.
    const entries = matrixToRecords('audit_log', sheetOf(source, 'audit_log'))
    expect(
      entries.map((entry) => [entry.entity_name, entry.entity_id])
    ).toEqual([
      ['client', 'CL1'],
      ['job', 'J1'],
      ['inventory', 'INV1'],
    ])

    // Metadata flipped; the backup still holds the pre-migration shop.
    const metadata = JSON.parse(
      source.files.get(METADATA_FILE_NAME)!
    ) as ShopMetadata
    expect(metadata.version).toBe('3.0.0')
    expect(decodeSheet(source.dirs.get(BACKUP_DIR)!.files.get('jobs.csv')!)[0])
      .toEqual(v1Header('jobs'))
  })

  it('skips the backup folder when the user opted out', async () => {
    const source = v1Shop()

    const result = await runPlans(resolvePlanChain(1, 3), makeTarget(source), {
      keepOriginalAsBackup: false,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('unreachable')
    expect(source.dirs.has(BACKUP_DIR)).toBe(false)

    await result.session.persist()
    expect([...source.dirs.keys()]).toEqual([])
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '3.0.0'
    )
  })

  it('halts on a header-prefix violation with the source untouched and the backup kept', async () => {
    const source = v1Shop()
    source.files.set(
      'clients.csv',
      encodeSheet([
        ['id', 'renamed_column'],
        ['CL1', 'Ana'],
      ])
    )
    const before = new Map(source.files)

    const result = await runPlans(resolvePlanChain(1, 3), makeTarget(source), {
      keepOriginalAsBackup: true,
    })

    expect(result).toEqual({ ok: false, failedAt: 'clients' })
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('failed')
    expect(state.failureMessage).toMatch(/renamed_column/)
    const clientsStep = state.steps.find((step) => step.id === 'clients')
    expect(clientsStep).toMatchObject({
      status: 'failed',
      error: expect.stringContaining('renamed_column'),
    })

    // Source shop untouched: same files, same content, version still 1.5.0.
    expect(new Map(source.files)).toEqual(before)
    // The backup was written at its step BEFORE the failure — that is the
    // point of taking it early: a failed run still leaves a restore point.
    expect(source.dirs.has(BACKUP_DIR)).toBe(true)
    expect([...source.dirs.keys()]).toEqual([BACKUP_DIR])
  })

  it('leaves no artefacts at all when a run without a backup fails', async () => {
    const source = v1Shop()
    source.files.set('clients.csv', encodeSheet([['id', 'renamed_column']]))
    const before = new Map(source.files)

    const result = await runPlans(resolvePlanChain(1, 3), makeTarget(source), {
      keepOriginalAsBackup: false,
    })

    expect(result).toEqual({ ok: false, failedAt: 'clients' })
    expect(new Map(source.files)).toEqual(before)
    expect([...source.dirs.keys()]).toEqual([])
  })

  it('re-runs as a no-op on an already-migrated shop (idempotent steps)', async () => {
    const source = v1Shop()
    const first = await runPlans(resolvePlanChain(1, 3), makeTarget(source), {
      keepOriginalAsBackup: false,
    })
    if (!first.ok) throw new Error('unreachable')
    await first.session.persist()
    const migratedFiles = new Map(source.files)

    useMigrationStore.getState().reset()
    const second = await runPlans(
      resolvePlanChain(1, 3),
      makeTarget(source, '3.0.0'),
      { keepOriginalAsBackup: false }
    )
    expect(second.ok).toBe(true)
    if (!second.ok) throw new Error('unreachable')
    expect(useMigrationStore.getState().phase).toBe('ready')

    await second.session.persist()
    // Headers were already canonical and the audit log already backfilled:
    // every sheet byte-identical, no duplicate audit entries.
    expect(new Map(source.files)).toEqual(migratedFiles)
  })
})
