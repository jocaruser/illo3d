import { SHEET_HEADERS, type SheetName } from '@/Config/schema'
import type {
  SheetMatrix,
  WorkbookRepositoryInterface,
} from '@/Repository/WorkbookRepositoryInterface'

/** Synthetic workbook id the in-memory migration run operates on. */
export const IN_MEMORY_WORKBOOK_ID = 'in-memory-migration'

function clone(matrix: SheetMatrix): SheetMatrix {
  return matrix.map((row) => [...row])
}

/**
 * The migration run's working surface (ADR-0012): every sheet matrix lives on
 * the JS heap, seeded once from the source shop, so plan steps mutate nothing
 * but memory. Only the target's `persist` — behind **Confirm and close** —
 * copies the result back to real storage. Matrices are deep-copied at every
 * boundary so neither steps nor targets can alias internal state.
 */
export class InMemoryWorkbookRepository implements WorkbookRepositoryInterface {
  private readonly sheets = new Map<SheetName, SheetMatrix>()

  /** Seed one sheet from the source shop. */
  load(sheet: SheetName, matrix: SheetMatrix): void {
    this.sheets.set(sheet, clone(matrix))
  }

  /** Every sheet currently held, for the target's persist pass. */
  entries(): [SheetName, SheetMatrix][] {
    return [...this.sheets.entries()].map(([sheet, matrix]) => [
      sheet,
      clone(matrix),
    ])
  }

  async readSheetMatrix(
    _workbookId: string,
    sheet: SheetName
  ): Promise<SheetMatrix> {
    const matrix = this.sheets.get(sheet)
    if (matrix === undefined) throw new Error(`Missing sheet '${sheet}'`)
    return clone(matrix)
  }

  async replaceSheetMatrix(
    _workbookId: string,
    sheet: SheetName,
    matrix: SheetMatrix
  ): Promise<void> {
    this.sheets.set(sheet, clone(matrix))
  }

  async getSheetNames(_workbookId: string): Promise<string[]> {
    return [...this.sheets.keys()]
  }

  async getHeaderRow(workbookId: string, sheet: SheetName): Promise<string[]> {
    return (await this.readSheetMatrix(workbookId, sheet))[0] ?? []
  }

  /** Migrations upgrade existing shops; they never mint new workbooks. */
  async createWorkbook(): Promise<string> {
    throw new Error('The in-memory migration workbook cannot create workbooks')
  }

  async ensureSheet(_workbookId: string, sheet: SheetName): Promise<void> {
    if (!this.sheets.has(sheet)) {
      this.sheets.set(sheet, [[...SHEET_HEADERS[sheet]]])
    }
  }
}
