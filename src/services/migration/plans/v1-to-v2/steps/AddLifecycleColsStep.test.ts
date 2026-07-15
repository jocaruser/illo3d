import { describe, it, expect, vi } from 'vitest'
import { SHEET_HEADERS } from '@/services/sheets/config'
import type { SheetsRepository } from '@/services/sheets/repository'
import type { MigrationContext } from '@/services/migration/MigrationContext'
import { AddLifecycleColsStep } from './AddLifecycleColsStep'

const V1_JOB_HEADERS = SHEET_HEADERS.jobs.slice(0, -2)

function contextWith(repo: Partial<SheetsRepository>): MigrationContext {
  return {
    backend: 'local-csv',
    workingSpreadsheetId: 'local-working',
    repo: repo as SheetsRepository,
    ensureSheet: vi.fn(async () => {}),
  }
}

describe('AddLifecycleColsStep', () => {
  it('uses the sheet name as card id', () => {
    expect(new AddLifecycleColsStep('jobs').id).toBe('jobs')
  })

  it('rewrites a v1 sheet to include the lifecycle columns', async () => {
    const matrix = [
      [...SHEET_HEADERS.jobs],
      ['J1', 'C1', 'print', 'todo', '10', '1', '2025-01-01', '', ''],
    ]
    const replaceSheetMatrix = vi.fn(async () => {})
    const ctx = contextWith({
      getHeaderRow: vi.fn(async () => [...V1_JOB_HEADERS]),
      readSheetMatrix: vi.fn(async () => matrix),
      replaceSheetMatrix,
    })
    const report = { update: vi.fn() }

    const result = await new AddLifecycleColsStep('jobs').execute(ctx, report)

    expect(result).toEqual({ status: 'done' })
    expect(replaceSheetMatrix).toHaveBeenCalledWith(
      'local-working',
      'jobs',
      matrix
    )
    expect(report.update).toHaveBeenCalledWith(
      'wizard.migrationStepCheckingColumns'
    )
    expect(report.update).toHaveBeenCalledWith(
      'wizard.migrationStepAddingColumns'
    )
  })

  it('is idempotent: leaves an already canonical sheet untouched', async () => {
    const replaceSheetMatrix = vi.fn(async () => {})
    const ctx = contextWith({
      getHeaderRow: vi.fn(async () => [...SHEET_HEADERS.jobs]),
      replaceSheetMatrix,
    })
    const report = { update: vi.fn() }

    const result = await new AddLifecycleColsStep('jobs').execute(ctx, report)

    expect(result).toEqual({ status: 'done' })
    expect(replaceSheetMatrix).not.toHaveBeenCalled()
    expect(report.update).not.toHaveBeenCalledWith(
      'wizard.migrationStepAddingColumns'
    )
  })

  it('fails when the stored header cannot be mapped to the canonical one', async () => {
    const ctx = contextWith({
      getHeaderRow: vi.fn(async () => ['id', 'surprise_column']),
    })
    const report = { update: vi.fn() }

    const result = await new AddLifecycleColsStep('jobs').execute(ctx, report)

    expect(result.status).toBe('failed')
    if (result.status === 'failed') {
      expect(result.error).toContain('surprise_column')
    }
  })
})
