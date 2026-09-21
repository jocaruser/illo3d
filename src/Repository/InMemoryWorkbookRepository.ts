import {
  SHEET_HEADERS,
  type SheetName,
} from '@/Config/schema'
import type {
  SheetMatrix,
  WorkbookRepositoryInterface,
} from '@/Repository/WorkbookRepositoryInterface'

/** Map-backed workbook used for migration sessions before explicit submit. */
export class InMemoryWorkbookRepository implements WorkbookRepositoryInterface {
  readonly sheets = new Map<string, SheetMatrix>()

  async readSheetMatrix(
    _workbookId: string,
    sheet: SheetName
  ): Promise<SheetMatrix> {
    const matrix = this.sheets.get(sheet)
    if (!matrix) throw new Error(`Missing sheet '${sheet}'`)
    return matrix.map((row) => [...row])
  }

  async replaceSheetMatrix(
    _workbookId: string,
    sheet: SheetName,
    matrix: SheetMatrix
  ): Promise<void> {
    this.sheets.set(
      sheet,
      matrix.map((row) => [...row])
    )
  }

  async getSheetNames(_workbookId: string): Promise<string[]> {
    return [...this.sheets.keys()]
  }

  async getHeaderRow(workbookId: string, sheet: SheetName): Promise<string[]> {
    return (await this.readSheetMatrix(workbookId, sheet))[0] ?? []
  }

  async createWorkbook(): Promise<string> {
    return 'in-memory'
  }

  async ensureSheet(_workbookId: string, sheet: SheetName): Promise<void> {
    if (!this.sheets.has(sheet)) {
      this.sheets.set(sheet, [[...SHEET_HEADERS[sheet]]])
    }
  }
}
