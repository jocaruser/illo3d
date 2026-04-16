import {
  SHEET_HEADERS,
  SHEET_NAMES,
  type SheetName,
} from '@/services/sheets/config'
import { emptySheetMatrix } from '@/services/sheets/sheetMatrix'
import { useWorkbookStore } from '@/stores/workbookStore'

export function resetAndSeedWorkbook(
  partial: Partial<Record<SheetName, string[][]>>,
): void {
  useWorkbookStore.getState().reset()
  const tabs = {} as Record<SheetName, string[][]>
  for (const name of SHEET_NAMES) {
    tabs[name] = partial[name] ?? emptySheetMatrix(name)
  }
  useWorkbookStore.setState({
    status: 'ready',
    spreadsheetId: 'test-ss',
    error: null,
    tabs,
    dirty: false,
  })
}

export function matrixWithRows(
  sheet: SheetName,
  dataRows: Record<string, string | number | undefined>[],
): string[][] {
  const h = SHEET_HEADERS[sheet]
  const header = h.map(String)
  const rows = dataRows.map((obj) =>
    h.map((col) => {
      const v = obj[col]
      if (v === undefined || v === null) return ''
      return String(v)
    }),
  )
  return [header, ...rows]
}
