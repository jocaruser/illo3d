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

describe('chained v1 → v3 migration over a local shop', () => {
  beforeEach(() => {
    useMigrationStore.getState().reset()
  })

  it('runs both plans and commits 3.0.0 with a backup', async () => {
    const source = v1Shop()
    const target = createLocalCsvMigrationTarget(
      source.asHandle(),
      '1.5.0',
      '3.0.0',
      CLOCK
    )
    const plans = resolvePlanChain(1, 3)

    const result = await runPlans(plans, target, { keepOriginalAsBackup: true })

    expect(result).toEqual({ ok: true })
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('done')
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

    // Metadata flipped to the LAST plan's toVersion; backup kept; working copy gone.
    const metadata = JSON.parse(
      source.files.get(METADATA_FILE_NAME)!
    ) as ShopMetadata
    expect(metadata.version).toBe('3.0.0')
    const backup = source.dirs.get('2026-07-16.v1.5.0.backup')!
    expect(backup).toBeDefined()
    expect(decodeSheet(backup.files.get('jobs.csv')!)[0]).toEqual(
      v1Header('jobs')
    )
    expect(JSON.parse(backup.files.get(METADATA_FILE_NAME)!).version).toBe(
      '1.5.0'
    )
    expect(source.dirs.has('2026-07-16.v1.5.0.v3.0.0.migration')).toBe(false)
  })

  it('skips the backup folder when the user opted out', async () => {
    const source = v1Shop()
    const target = createLocalCsvMigrationTarget(
      source.asHandle(),
      '1.5.0',
      '3.0.0',
      CLOCK
    )

    const result = await runPlans(resolvePlanChain(1, 3), target, {
      keepOriginalAsBackup: false,
    })

    expect(result).toEqual({ ok: true })
    expect(source.dirs.has('2026-07-16.v1.5.0.backup')).toBe(false)
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '3.0.0'
    )
  })

  it('halts on a header-prefix violation, leaving the source untouched and the working copy for inspection', async () => {
    const source = v1Shop()
    source.files.set(
      'clients.csv',
      encodeSheet([
        ['id', 'renamed_column'],
        ['CL1', 'Ana'],
      ])
    )
    const before = new Map(source.files)
    const target = createLocalCsvMigrationTarget(
      source.asHandle(),
      '1.5.0',
      '3.0.0',
      CLOCK
    )

    const result = await runPlans(resolvePlanChain(1, 3), target, {
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

    // Source shop untouched: same files, same content, no backup, version still 1.5.0.
    expect(new Map(source.files)).toEqual(before)
    expect(source.dirs.has('2026-07-16.v1.5.0.backup')).toBe(false)
    // The failed working copy stays in place for inspection.
    expect(source.dirs.has('2026-07-16.v1.5.0.v3.0.0.migration')).toBe(true)
  })

  it('re-runs as a no-op on an already-migrated shop (idempotent steps)', async () => {
    const source = v1Shop()
    const firstTarget = createLocalCsvMigrationTarget(
      source.asHandle(),
      '1.5.0',
      '3.0.0',
      CLOCK
    )
    await runPlans(resolvePlanChain(1, 3), firstTarget, {
      keepOriginalAsBackup: false,
    })
    const migratedFiles = new Map(source.files)

    useMigrationStore.getState().reset()
    const secondTarget = createLocalCsvMigrationTarget(
      source.asHandle(),
      '3.0.0',
      '3.0.0',
      CLOCK
    )
    const result = await runPlans(resolvePlanChain(1, 3), secondTarget, {
      keepOriginalAsBackup: false,
    })

    expect(result).toEqual({ ok: true })
    expect(useMigrationStore.getState().phase).toBe('done')
    // Headers were already canonical and the audit log already backfilled:
    // every sheet byte-identical, no duplicate audit entries.
    expect(new Map(source.files)).toEqual(migratedFiles)
  })
})
