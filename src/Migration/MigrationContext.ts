import type { SheetName } from '@/Config/schema'
import type { WorkbookRepositoryInterface } from '@/Repository/WorkbookRepositoryInterface'

/**
 * Everything a migration step needs to read and rewrite the in-memory copy of
 * the shop. Steps never see the source storage — the target seeds the copy at
 * `open` and only its `persist` (behind Confirm and close) touches the shop.
 */
export interface MigrationContext {
  backend: 'local-csv' | 'google-drive'
  /** Synthetic id of the in-memory workbook the steps operate on. */
  workingWorkbookId: string
  repo: WorkbookRepositoryInterface
  /** Create a sheet with its canonical header when absent (idempotent). */
  ensureSheet(sheet: SheetName): Promise<void>
}
