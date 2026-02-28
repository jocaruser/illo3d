import { sheetsFetch } from './client'
import { SHEET_HEADERS, type SheetName } from './config'

function rowToObject<T extends object>(
  headers: readonly string[],
  row: unknown[]
): T {
  const obj = {} as T
  headers.forEach((header, i) => {
    const value = row[i]
    if (value !== undefined && value !== null && value !== '') {
      ;(obj as Record<string, unknown>)[header] = value
    }
  })
  return obj
}

export async function readSheetRows<T extends object>(
  spreadsheetId: string,
  sheetName: SheetName,
  accessToken: string
): Promise<T[]> {
  const headers = SHEET_HEADERS[sheetName]
  const range = `'${sheetName}'!A:Z`

  const response = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    accessToken
  )

  if (!response.ok) {
    throw new Error(`Failed to read ${sheetName}: ${response.status}`)
  }

  const data = await response.json()
  const rows = data.values || []

  if (rows.length < 2) {
    return []
  }

  const dataRows = rows.slice(1)
  return dataRows.map((row: unknown[]) => rowToObject<T>(headers, row))
}
