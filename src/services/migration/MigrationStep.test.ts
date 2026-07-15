import { describe, it, expect, vi } from 'vitest'
import { SHEET_HEADERS } from '@/services/sheets/config'
import type { SheetsRepository } from '@/services/sheets/repository'
import type { MigrationContext } from './MigrationContext'
import { MigrationStep, type ProgressReporter } from './MigrationStep'

const V1_CLIENT_HEADERS = SHEET_HEADERS.clients.slice(0, -2)

class TestStep extends MigrationStep {
  readonly id = 'clients'
  readonly label = 'clients'

  constructor(
    private readonly behavior: (
      step: TestStep,
      ctx: MigrationContext,
      report: ProgressReporter
    ) => Promise<void>
  ) {
    super()
  }

  protected migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void> {
    return this.behavior(this, ctx, report)
  }

  extendClients(ctx: MigrationContext): Promise<void> {
    return this.extendSheetToCanonicalColumns(ctx, 'clients')
  }

  clientsHeaderIsCanonical(ctx: MigrationContext): Promise<boolean> {
    return this.hasCanonicalHeader(ctx, 'clients')
  }
}

function contextWith(repo: Partial<SheetsRepository>): MigrationContext {
  return {
    backend: 'local-csv',
    workingSpreadsheetId: 'local-working',
    repo: repo as SheetsRepository,
    ensureSheet: vi.fn(async () => {}),
  }
}

const stubReporter: ProgressReporter = { update: vi.fn() }

describe('MigrationStep.execute', () => {
  it('returns done when migrate resolves', async () => {
    const step = new TestStep(async () => {})
    const result = await step.execute(contextWith({}), stubReporter)
    expect(result).toEqual({ status: 'done' })
  })

  it('normalizes thrown errors into a failed result', async () => {
    const step = new TestStep(async () => {
      throw new Error('boom')
    })
    const result = await step.execute(contextWith({}), stubReporter)
    expect(result).toEqual({ status: 'failed', error: 'boom' })
  })

  it('normalizes non-Error throws into a failed result', async () => {
    const step = new TestStep(async () => {
      throw 'string failure'
    })
    const result = await step.execute(contextWith({}), stubReporter)
    expect(result).toEqual({ status: 'failed', error: 'string failure' })
  })
})

describe('MigrationStep header helpers', () => {
  it('hasCanonicalHeader is true for the canonical v2 header', async () => {
    const ctx = contextWith({
      getHeaderRow: vi.fn(async () => [...SHEET_HEADERS.clients]),
    })
    const step = new TestStep(async () => {})
    expect(await step.clientsHeaderIsCanonical(ctx)).toBe(true)
  })

  it('hasCanonicalHeader is false for a v1 header', async () => {
    const ctx = contextWith({
      getHeaderRow: vi.fn(async () => [...V1_CLIENT_HEADERS]),
    })
    const step = new TestStep(async () => {})
    expect(await step.clientsHeaderIsCanonical(ctx)).toBe(false)
  })

  it('extendSheetToCanonicalColumns rewrites a v1 sheet to canonical form', async () => {
    const canonicalMatrix = [
      [...SHEET_HEADERS.clients],
      ['C1', 'Ann', '', '', '', '', '', '', '2025-01-01', '', ''],
    ]
    const replaceSheetMatrix = vi.fn(async () => {})
    const ctx = contextWith({
      getHeaderRow: vi.fn(async () => [...V1_CLIENT_HEADERS]),
      readSheetMatrix: vi.fn(async () => canonicalMatrix),
      replaceSheetMatrix,
    })
    const step = new TestStep(async () => {})
    await step.extendClients(ctx)
    expect(replaceSheetMatrix).toHaveBeenCalledWith(
      'local-working',
      'clients',
      canonicalMatrix
    )
  })

  it('extendSheetToCanonicalColumns skips the write when already canonical', async () => {
    const replaceSheetMatrix = vi.fn(async () => {})
    const ctx = contextWith({
      getHeaderRow: vi.fn(async () => [...SHEET_HEADERS.clients]),
      replaceSheetMatrix,
    })
    const step = new TestStep(async () => {})
    await step.extendClients(ctx)
    expect(replaceSheetMatrix).not.toHaveBeenCalled()
  })

  it('extendSheetToCanonicalColumns rejects a header that is not a canonical prefix', async () => {
    const ctx = contextWith({
      getHeaderRow: vi.fn(async () => ['id', 'unexpected_column']),
    })
    const step = new TestStep(async () => {})
    await expect(step.extendClients(ctx)).rejects.toThrow(
      'column 2 is "unexpected_column"'
    )
  })

  it('extendSheetToCanonicalColumns rejects a header with too many columns', async () => {
    const ctx = contextWith({
      getHeaderRow: vi.fn(async () => [...SHEET_HEADERS.clients, 'extra']),
    })
    const step = new TestStep(async () => {})
    await expect(step.extendClients(ctx)).rejects.toThrow('at most')
  })

  it('ignores trailing empty header cells', async () => {
    const replaceSheetMatrix = vi.fn(async () => {})
    const ctx = contextWith({
      getHeaderRow: vi.fn(async () => [...SHEET_HEADERS.clients, '', '']),
      replaceSheetMatrix,
    })
    const step = new TestStep(async () => {})
    await step.extendClients(ctx)
    expect(replaceSheetMatrix).not.toHaveBeenCalled()
  })
})
