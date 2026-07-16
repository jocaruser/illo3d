import type { SheetName } from '@/Config/schema'

/**
 * A sheet matrix: row 0 is the header row, subsequent rows are data rows.
 * Cells are always strings.
 */
export type SheetMatrix = string[][]

/**
 * Storage backend contract for a shop workbook. Two production
 * implementations exist:
 *   - `LocalCsvWorkbookRepository` — one CSV file per sheet in a local folder
 *     accessed through the File System Access API (Chromium only).
 *   - `GSheetWorkbookRepository` — one tab per sheet in a Google Spreadsheet
 *     accessed through the Sheets REST API with the user's OAuth token.
 *
 * The repository is only invoked by the snapshot layer (hydrate / refresh /
 * save), by shop provisioning, and by the migration engine. Routine UI reads
 * and mutations operate on the in-memory workbook snapshot instead.
 */
export interface WorkbookRepositoryInterface {
  /** Read a whole sheet including its header row. Missing sheet → error. */
  readSheetMatrix(workbookId: string, sheet: SheetName): Promise<SheetMatrix>

  /** Replace a whole sheet (header + data rows) atomically from the caller's view. */
  replaceSheetMatrix(workbookId: string, sheet: SheetName, matrix: SheetMatrix): Promise<void>

  /** List the sheet/tab names present in the workbook. */
  getSheetNames(workbookId: string): Promise<string[]>

  /** Read only the header row of a sheet. */
  getHeaderRow(workbookId: string, sheet: SheetName): Promise<string[]>

  /**
   * Create a brand-new workbook containing every canonical sheet with its
   * canonical header row. Returns the new workbook id (spreadsheet id for
   * Google, a synthetic `local-<folder>` id for local CSV).
   */
  createWorkbook(): Promise<string>

  /** Ensure a sheet exists (used by migrations); creates it with the canonical header when absent. */
  ensureSheet(workbookId: string, sheet: SheetName): Promise<void>
}
