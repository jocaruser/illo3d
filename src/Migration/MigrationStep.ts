import { SHEET_HEADERS, type SheetName } from '@/Config/schema'
import type { MigrationContext } from './MigrationContext'

/** Streams a live description (an i18n key) to the wizard's step grid. */
export interface ProgressReporter {
  update(i18nKey: string): void
}

export type StepResult =
  { status: 'done' } | { status: 'failed'; error: string }

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Trim every cell and drop trailing empty cells (spreadsheets often pad headers). */
function cleanHeader(header: string[]): string[] {
  const cleaned = header.map((cell) => cell.trim())
  while (cleaned.length > 0 && cleaned[cleaned.length - 1] === '') cleaned.pop()
  return cleaned
}

/**
 * One idempotent unit of a migration plan. Data maps by **position**, so the
 * safety invariant every step relies on is: the stored header must be a prefix
 * of the canonical header. A violation aborts the step (and the run) before
 * anything is rewritten.
 */
export abstract class MigrationStep {
  /** Wizard grid row id, e.g. 'clients', 'jobs', 'audit_log'. */
  abstract readonly id: string

  abstract migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void>

  /** Run `migrate` and fold any thrown error into a failed step result. */
  async execute(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<StepResult> {
    try {
      await this.migrate(ctx, report)
      return { status: 'done' }
    } catch (error) {
      return { status: 'failed', error: toErrorMessage(error) }
    }
  }

  /** The stored header row of a sheet, trimmed, without trailing empties. */
  protected async readStoredHeader(
    ctx: MigrationContext,
    sheet: SheetName
  ): Promise<string[]> {
    return cleanHeader(
      await ctx.repo.getHeaderRow(ctx.workingWorkbookId, sheet)
    )
  }

  /** True when the stored header already matches the canonical header exactly. */
  protected async hasCanonicalHeader(
    ctx: MigrationContext,
    sheet: SheetName
  ): Promise<boolean> {
    const stored = await this.readStoredHeader(ctx, sheet)
    const canonical = SHEET_HEADERS[sheet]
    return (
      stored.length === canonical.length &&
      canonical.every((column, i) => stored[i] === column)
    )
  }

  /**
   * Enforce the by-position safety invariant: every stored column must sit at
   * its canonical position. Throws naming the first mismatched column.
   */
  protected assertStoredHeaderIsCanonicalPrefix(
    sheet: SheetName,
    stored: string[]
  ): void {
    const canonical = SHEET_HEADERS[sheet]
    for (let i = 0; i < stored.length; i += 1) {
      if (i >= canonical.length || stored[i] !== canonical[i]) {
        throw new Error(
          `Sheet '${sheet}': stored column '${stored[i]}' (position ${i + 1}) does not match the expected schema — data maps by position, refusing to migrate`
        )
      }
    }
  }

  /**
   * Rewrite a sheet with the canonical (v3) header, padding every data row
   * with '' up to the canonical width. Asserts the prefix invariant first.
   */
  protected async extendSheetToCanonicalColumns(
    ctx: MigrationContext,
    sheet: SheetName
  ): Promise<void> {
    const matrix = await ctx.repo.readSheetMatrix(ctx.workingWorkbookId, sheet)
    this.assertStoredHeaderIsCanonicalPrefix(
      sheet,
      cleanHeader(matrix[0] ?? [])
    )
    const canonical = [...SHEET_HEADERS[sheet]]
    const rows = matrix.slice(1).map((row) => {
      const padded = row.slice(0, canonical.length)
      while (padded.length < canonical.length) padded.push('')
      return padded
    })
    await ctx.repo.replaceSheetMatrix(ctx.workingWorkbookId, sheet, [
      canonical,
      ...rows,
    ])
  }
}
