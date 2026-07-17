import { describe, expect, it, vi } from 'vitest'
import { SHEET_HEADERS, type SheetName } from '@/Config/schema'
import type { MigrationContext } from '@/Migration/MigrationContext'
import {
  MigrationStep,
  toErrorMessage,
  type ProgressReporter,
} from '@/Migration/MigrationStep'
import {
  contextFor,
  InMemoryWorkbookRepository,
  RecordingReporter,
} from './helpers'

class TestStep extends MigrationStep {
  readonly id = 'test'
  migrateImpl: (
    ctx: MigrationContext,
    report: ProgressReporter
  ) => Promise<void> = async () => {}

  async migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void> {
    await this.migrateImpl(ctx, report)
  }

  readHeader(ctx: MigrationContext, sheet: SheetName): Promise<string[]> {
    return this.readStoredHeader(ctx, sheet)
  }

  hasCanonical(ctx: MigrationContext, sheet: SheetName): Promise<boolean> {
    return this.hasCanonicalHeader(ctx, sheet)
  }

  assertPrefix(sheet: SheetName, stored: string[]): void {
    this.assertStoredHeaderIsCanonicalPrefix(sheet, stored)
  }

  extend(ctx: MigrationContext, sheet: SheetName): Promise<void> {
    return this.extendSheetToCanonicalColumns(ctx, sheet)
  }
}

function setup(sheets: Partial<Record<SheetName, string[][]>> = {}) {
  const repo = new InMemoryWorkbookRepository()
  for (const [sheet, matrix] of Object.entries(sheets)) {
    repo.sheets.set(sheet, matrix)
  }
  return { repo, ctx: contextFor(repo), step: new TestStep() }
}

describe('toErrorMessage', () => {
  it('uses the message of Error instances', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('stringifies non-Error values', () => {
    expect(toErrorMessage('plain failure')).toBe('plain failure')
  })
})

describe('MigrationStep.execute', () => {
  it('returns done when migrate succeeds', async () => {
    const { ctx, step } = setup()
    await expect(step.execute(ctx, new RecordingReporter())).resolves.toEqual({
      status: 'done',
    })
  })

  it('folds a thrown Error into a failed result', async () => {
    const { ctx, step } = setup()
    step.migrateImpl = async () => {
      throw new Error('header mismatch')
    }
    await expect(step.execute(ctx, new RecordingReporter())).resolves.toEqual({
      status: 'failed',
      error: 'header mismatch',
    })
  })

  it('folds a thrown non-Error into a failed result', async () => {
    const { ctx, step } = setup()
    step.migrateImpl = async () => {
      throw 'string failure'
    }
    await expect(step.execute(ctx, new RecordingReporter())).resolves.toEqual({
      status: 'failed',
      error: 'string failure',
    })
  })
})

describe('readStoredHeader', () => {
  it('trims cells and drops trailing empties', async () => {
    const { ctx, step } = setup({ tags: [[' id', 'name ', '', '  ']] })
    await expect(step.readHeader(ctx, 'tags')).resolves.toEqual(['id', 'name'])
  })

  it('returns [] for an all-empty header', async () => {
    const { ctx, step } = setup({ tags: [['', ' ']] })
    await expect(step.readHeader(ctx, 'tags')).resolves.toEqual([])
  })
})

describe('hasCanonicalHeader', () => {
  it('is true when the stored header matches exactly', async () => {
    const { ctx, step } = setup({ tags: [[...SHEET_HEADERS.tags]] })
    await expect(step.hasCanonical(ctx, 'tags')).resolves.toBe(true)
  })

  it('is false when the stored header is shorter', async () => {
    const { ctx, step } = setup({ tags: [['id', 'name', 'created_at']] })
    await expect(step.hasCanonical(ctx, 'tags')).resolves.toBe(false)
  })

  it('is false when a same-length header has a renamed column', async () => {
    const { ctx, step } = setup({
      tags: [['id', 'label', 'created_at', 'archived', 'deleted']],
    })
    await expect(step.hasCanonical(ctx, 'tags')).resolves.toBe(false)
  })
})

describe('assertStoredHeaderIsCanonicalPrefix', () => {
  it('accepts a strict prefix of the canonical header', () => {
    const { step } = setup()
    expect(() =>
      step.assertPrefix('tags', ['id', 'name', 'created_at'])
    ).not.toThrow()
  })

  it('accepts the full canonical header', () => {
    const { step } = setup()
    expect(() =>
      step.assertPrefix('tags', [...SHEET_HEADERS.tags])
    ).not.toThrow()
  })

  it('throws naming the first mismatched column', () => {
    const { step } = setup()
    expect(() =>
      step.assertPrefix('tags', ['id', 'label', 'created_at'])
    ).toThrow(/Sheet 'tags': stored column 'label' \(position 2\)/)
  })

  it('throws naming a column that overflows the canonical header', () => {
    const { step } = setup()
    expect(() =>
      step.assertPrefix('tags', [...SHEET_HEADERS.tags, 'extra'])
    ).toThrow(/stored column 'extra'/)
  })
})

describe('extendSheetToCanonicalColumns', () => {
  it('rewrites with the canonical header and pads rows with empty cells', async () => {
    const { repo, ctx, step } = setup({
      tags: [
        ['id', 'name', 'created_at'],
        ['TG1', 'urgent', '2024-01-01'],
      ],
    })
    await step.extend(ctx, 'tags')
    expect(repo.sheets.get('tags')).toEqual([
      ['id', 'name', 'created_at', 'archived', 'deleted'],
      ['TG1', 'urgent', '2024-01-01', '', ''],
    ])
  })

  it('trims header noise and truncates rows wider than the canonical header', async () => {
    const { repo, ctx, step } = setup({
      tags: [
        ['id ', ' name', 'created_at', ''],
        [
          'TG1',
          'urgent',
          '2024-01-01',
          'stray',
          'cells',
          'beyond',
          'canonical',
        ],
      ],
    })
    await step.extend(ctx, 'tags')
    expect(repo.sheets.get('tags')).toEqual([
      ['id', 'name', 'created_at', 'archived', 'deleted'],
      ['TG1', 'urgent', '2024-01-01', 'stray', 'cells'],
    ])
  })

  it('turns a completely empty matrix into a canonical header-only sheet', async () => {
    const { repo, ctx, step } = setup({ tags: [] })
    await step.extend(ctx, 'tags')
    expect(repo.sheets.get('tags')).toEqual([
      ['id', 'name', 'created_at', 'archived', 'deleted'],
    ])
  })

  it('refuses to rewrite when the stored header is not a canonical prefix', async () => {
    const { repo, ctx, step } = setup({
      tags: [
        ['id', 'wrong_column'],
        ['TG1', 'urgent'],
      ],
    })
    const replaceSpy = vi.spyOn(repo, 'replaceSheetMatrix')
    await expect(step.extend(ctx, 'tags')).rejects.toThrow(/wrong_column/)
    expect(replaceSpy).not.toHaveBeenCalled()
  })
})
