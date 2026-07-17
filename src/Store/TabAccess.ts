import type { SheetName } from '@/Config/schema'
import type { SheetMatrix } from '@/Repository/WorkbookRepositoryInterface'
import { useWorkbookStore } from './workbookStore'

/**
 * Narrow read/mutate view over the workbook snapshot. Repositories and the
 * audit logger depend on this interface instead of the Zustand store so the
 * domain layer stays framework-free and trivially testable.
 */
export interface TabAccess {
  getTab(sheet: SheetName): SheetMatrix
  mutateTab(sheet: SheetName, mutate: (matrix: SheetMatrix) => SheetMatrix): void
}

/** TabAccess adapter over the live workbook store. */
export function workbookTabAccess(): TabAccess {
  return {
    getTab: (sheet) => useWorkbookStore.getState().tabs[sheet],
    mutateTab: (sheet, mutate) => useWorkbookStore.getState().mutateTab(sheet, mutate),
  }
}
