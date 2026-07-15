import { SHEET_HEADERS, type SheetName } from '@/services/sheets/config'
import type { MigrationContext } from './MigrationContext'

export interface ProgressReporter {
  update(descriptionKey: string): void
}

export type StepResult =
  | { status: 'done' }
  | { status: 'failed'; error: string }

export abstract class MigrationStep {
  abstract readonly id: string
  abstract readonly label: string

  protected abstract migrate(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<void>

  async execute(
    ctx: MigrationContext,
    report: ProgressReporter
  ): Promise<StepResult> {
    try {
      await this.migrate(ctx, report)
      return { status: 'done' }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  protected async hasCanonicalHeader(
    ctx: MigrationContext,
    sheetName: SheetName
  ): Promise<boolean> {
    const stored = await this.readStoredHeader(ctx, sheetName)
    const canonical = SHEET_HEADERS[sheetName]
    return (
      stored.length === canonical.length &&
      canonical.every((header, i) => stored[i] === header)
    )
  }

  protected async extendSheetToCanonicalColumns(
    ctx: MigrationContext,
    sheetName: SheetName
  ): Promise<void> {
    const stored = await this.readStoredHeader(ctx, sheetName)
    this.assertStoredHeaderIsCanonicalPrefix(sheetName, stored)
    if (stored.length === SHEET_HEADERS[sheetName].length) return
    const matrix = await ctx.repo.readSheetMatrix(
      ctx.workingSpreadsheetId,
      sheetName
    )
    await ctx.repo.replaceSheetMatrix(ctx.workingSpreadsheetId, sheetName, matrix)
  }

  // Column data is mapped by position, so migration is only safe when the
  // stored header is a prefix of the canonical one (new columns append at the end).
  private assertStoredHeaderIsCanonicalPrefix(
    sheetName: SheetName,
    stored: string[]
  ): void {
    const canonical = SHEET_HEADERS[sheetName]
    if (stored.length > canonical.length) {
      throw new Error(
        `${sheetName}: has ${stored.length} columns, expected at most ${canonical.length}`
      )
    }
    stored.forEach((header, i) => {
      if (header !== canonical[i]) {
        throw new Error(
          `${sheetName}: column ${i + 1} is "${header}", expected "${canonical[i]}"`
        )
      }
    })
  }

  private async readStoredHeader(
    ctx: MigrationContext,
    sheetName: SheetName
  ): Promise<string[]> {
    const header = await ctx.repo.getHeaderRow(
      ctx.workingSpreadsheetId,
      sheetName
    )
    const trimmed = header.map((cell) => cell.trim())
    while (trimmed.length > 0 && trimmed[trimmed.length - 1] === '') {
      trimmed.pop()
    }
    return trimmed
  }
}
