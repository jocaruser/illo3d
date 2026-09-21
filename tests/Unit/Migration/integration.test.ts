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
import { parseCsv, serializeCsv } from '@/Repository/LocalCsv/Csv'
import { matrixToRecords } from '@/Repository/Matrix'
import { useMigrationStore } from '@/Store/migrationStore'
import {
  FakeDirectoryHandle,
  FixedClock,
  shopMetadata,
  v1Header,
} from './helpers'

vi.mock('@/Repository/LocalCsv/LocalCsvFolderRepository', async () => {
  const { FakeLocalCsvFolderRepository } = await import('./helpers')
  return { LocalCsvFolderRepository: FakeLocalCsvFolderRepository }
})

const CLOCK = new FixedClock('2026-07-16T10:00:00.000Z')

/** Build a full v1 local shop: every data sheet as a v1-shaped CSV, no audit_log. */
function v1Shop(): FakeDirectoryHandle {
  const source = new FakeDirectoryHandle('my-shop')
  for (const sheet of DATA_SHEET_NAMES) {
    source.files.set(`${sheet}.csv`, serializeCsv([v1Header(sheet)]))
  }
  source.files.set(
    'clients.csv',
    serializeCsv([
      v1Header('clients'),
      ['CL1', 'Ana', 'ana@x.test', '', '', '', '', '', '2024-01-01'],
    ])
  )
  source.files.set(
    'jobs.csv',
    serializeCsv([
      v1Header('jobs'),
      ['J1', 'CL1', 'Vase', 'pending', '25', '1', '2024-01-05'],
    ])
  )
  source.files.set(
    'inventory.csv',
    serializeCsv([
      v1Header('inventory'),
      ['INV1', 'filament', 'PLA', '900', '500', '250', '100', '2024-01-02'],
    ])
  )
  source.files.set(METADATA_FILE_NAME, JSON.stringify(shopMetadata('1.5.0')))
  return source
}

function sheetOf(source: FakeDirectoryHandle, name: string) {
  return parseCsv(source.files.get(`${name}.csv`)!)
}

describe('chained v1 → v3 migration over a local shop', () => {
  beforeEach(() => {
    useMigrationStore.getState().reset()
  })

  it('runs both plans in memory, then submit persists 3.0.0 with a backup', async () => {
    const source = v1Shop()
    const target = createLocalCsvMigrationTarget(
      source.asHandle(),
      '1.5.0',
      '3.0.0',
      CLOCK
    )
    const plans = resolvePlanChain(1, 3)

    const result = await runPlans(plans, target, { keepOriginalAsBackup: true })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const state = useMigrationStore.getState()
    expect(state.phase).toBe('awaiting-submit')
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '1.5.0'
    )
    const backup = source.dirs.get('2026-07-16.v1.5.0.backup')!
    expect(backup).toBeDefined()
    expect(source.dirs.has('2026-07-16.v1.5.0.v3.0.0.migration')).toBe(false)

    await result.session.submit({ keepOriginalAsBackup: true })

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

    expect(sheetOf(source, 'jobs')).toEqual([
      [...SHEET_HEADERS.jobs],
      ['J1', 'CL1', 'Vase', 'pending', '25', '1', '2024-01-05', '', '', ''],
    ])
    expect(sheetOf(source, 'inventory')[0]).toEqual([
      ...SHEET_HEADERS.inventory,
    ])

    const entries = matrixToRecords('audit_log', sheetOf(source, 'audit_log'))
    expect(
      entries.map((entry) => [entry.entity_name, entry.entity_id])
    ).toEqual([
      ['client', 'CL1'],
      ['job', 'J1'],
      ['inventory', 'INV1'],
    ])

    const metadata = JSON.parse(
      source.files.get(METADATA_FILE_NAME)!
    ) as ShopMetadata
    expect(metadata.version).toBe('3.0.0')
    expect(parseCsv(backup.files.get('jobs.csv')!)[0]).toEqual(
      v1Header('jobs')
    )
    expect(JSON.parse(backup.files.get(METADATA_FILE_NAME)!).version).toBe(
      '1.5.0'
    )
  })

  it('skips the backup folder when the user opted out until submit', async () => {
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
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(source.dirs.has('2026-07-16.v1.5.0.backup')).toBe(false)
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '1.5.0'
    )

    await result.session.submit({ keepOriginalAsBackup: false })
    expect(source.dirs.has('2026-07-16.v1.5.0.backup')).toBe(false)
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '3.0.0'
    )
  })

  it('halts on a header-prefix violation after backup, leaving source CSVs untouched', async () => {
    const source = v1Shop()
    source.files.set(
      'clients.csv',
      serializeCsv([
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
    expect(new Map(source.files)).toEqual(before)
    expect(source.dirs.has('2026-07-16.v1.5.0.backup')).toBe(true)
    expect(source.dirs.has('2026-07-16.v1.5.0.v3.0.0.migration')).toBe(false)
    expect(JSON.parse(source.files.get(METADATA_FILE_NAME)!).version).toBe(
      '1.5.0'
    )
  })

  it('re-runs as a no-op on an already-migrated shop (idempotent steps)', async () => {
    const source = v1Shop()
    const firstTarget = createLocalCsvMigrationTarget(
      source.asHandle(),
      '1.5.0',
      '3.0.0',
      CLOCK
    )
    const first = await runPlans(resolvePlanChain(1, 3), firstTarget, {
      keepOriginalAsBackup: false,
    })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    await first.session.submit({ keepOriginalAsBackup: false })
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

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(useMigrationStore.getState().phase).toBe('awaiting-submit')
    await result.session.submit({ keepOriginalAsBackup: false })
    expect(new Map(source.files)).toEqual(migratedFiles)
  })
})
