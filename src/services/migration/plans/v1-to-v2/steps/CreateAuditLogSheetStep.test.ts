import { describe, it, expect, vi } from 'vitest'
import type { SheetsRepository } from '@/services/sheets/repository'
import type { MigrationContext } from '@/services/migration/MigrationContext'
import { CreateAuditLogSheetStep } from './CreateAuditLogSheetStep'

function contextWith(
  rowsBySheet: Record<string, Record<string, unknown>[]>
): {
  ctx: MigrationContext
  ensureSheet: ReturnType<typeof vi.fn>
  appendRows: ReturnType<typeof vi.fn>
} {
  const ensureSheet = vi.fn(async () => {})
  const appendRows = vi.fn(async () => {})
  const repo = {
    readRows: vi.fn(async (_id: string, sheetName: string) => {
      return rowsBySheet[sheetName] ?? []
    }),
    appendRows,
  } as unknown as SheetsRepository
  return {
    ctx: {
      backend: 'local-csv',
      workingSpreadsheetId: 'local-working',
      repo,
      ensureSheet,
    },
    ensureSheet,
    appendRows,
  }
}

function appendedEntries(appendRows: ReturnType<typeof vi.fn>) {
  return appendRows.mock.calls.flatMap(
    ([, , rows]) => rows as Record<string, unknown>[]
  )
}

describe('CreateAuditLogSheetStep', () => {
  it('ensures the audit_log sheet exists before backfilling', async () => {
    const { ctx, ensureSheet } = contextWith({})
    const report = { update: vi.fn() }

    const result = await new CreateAuditLogSheetStep().execute(ctx, report)

    expect(result).toEqual({ status: 'done' })
    expect(ensureSheet).toHaveBeenCalledWith('audit_log')
    expect(report.update).toHaveBeenCalledWith(
      'wizard.migrationStepCreatingAuditLog'
    )
    expect(report.update).toHaveBeenCalledWith(
      'wizard.migrationStepRecordingExisting'
    )
  })

  it('records one migration entry per existing row', async () => {
    const { ctx, appendRows } = contextWith({
      clients: [{ id: 'C1', name: 'Ann' }],
      jobs: [
        { id: 'J1', client_id: 'C1' },
        { id: 'J2', client_id: 'C1' },
      ],
    })

    await new CreateAuditLogSheetStep().execute(ctx, { update: vi.fn() })

    const entries = appendedEntries(appendRows)
    expect(entries).toHaveLength(3)
    const clientEntry = entries.find((entry) => entry.entity_id === 'C1')!
    expect(clientEntry.entity_name).toBe('client')
    expect(clientEntry.action).toBe('migration')
    expect(clientEntry.actor).toBe('migration')
    expect(clientEntry.before_json).toBe('')
    expect(JSON.parse(clientEntry.after_json as string)).toEqual({
      id: 'C1',
      name: 'Ann',
    })
    const jobEntries = entries.filter((entry) => entry.entity_name === 'job')
    expect(jobEntries.map((entry) => entry.entity_id)).toEqual(['J1', 'J2'])
  })

  it('assigns each entry a unique id and a shared timestamp', async () => {
    const { ctx, appendRows } = contextWith({
      tags: [{ id: 'T1' }, { id: 'T2' }],
    })

    await new CreateAuditLogSheetStep().execute(ctx, { update: vi.fn() })

    const entries = appendedEntries(appendRows)
    const ids = entries.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(2)
    expect(entries[0].timestamp).toBe(entries[1].timestamp)
  })

  it('skips rows without an id', async () => {
    const { ctx, appendRows } = contextWith({
      clients: [{ id: 'C1' }, { name: 'orphan row' }],
    })

    await new CreateAuditLogSheetStep().execute(ctx, { update: vi.fn() })

    expect(appendedEntries(appendRows)).toHaveLength(1)
  })

  it('never targets the audit_log sheet as a source', async () => {
    const { ctx } = contextWith({})

    await new CreateAuditLogSheetStep().execute(ctx, { update: vi.fn() })

    const readSheets = vi
      .mocked(ctx.repo.readRows)
      .mock.calls.map(([, sheetName]) => sheetName)
    expect(readSheets).not.toContain('audit_log')
    expect(readSheets).toHaveLength(10)
  })
})
