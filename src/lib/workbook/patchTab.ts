import { useWorkbookStore } from '@/stores/workbookStore'
import type { SheetName } from '@/services/sheets/config'
import { ensureMatrix } from '@/lib/workbook/matrixOps'

export function patchWorkbookTab(
  sheetName: SheetName,
  updater: (matrix: string[][]) => string[][]
): void {
  const { tabs, mutateTab } = useWorkbookStore.getState()
  mutateTab(sheetName, updater(ensureMatrix(tabs, sheetName)))
}
