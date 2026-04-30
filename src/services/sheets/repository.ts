import { getBackend } from '@/config/csvBackend'
import { useBackendStore } from '@/stores/backendStore'
import { LocalSheetsRepository } from '@/services/local/LocalSheetsRepository'
import { sheetsFetch } from './client'
import {
  SPREADSHEET_NAME,
  SHEET_NAMES,
  SHEET_HEADERS,
  type SheetName,
} from './config'
import type { ValidationError } from './validateStructure'
import { normalizeSheetMatrixFromApi } from './sheetMatrix'

export interface SheetsRepository {
  readRows<T extends object>(
    spreadsheetId: string,
    sheetName: SheetName
  ): Promise<T[]>
  appendRows(
    spreadsheetId: string,
    sheetName: SheetName,
    rows: Record<string, unknown>[]
  ): Promise<void>
  /**
   * Overwrites one data row. `rowIndex` is 1-based:1 = first data row (sheet row 2).
   */
  updateRow(
    spreadsheetId: string,
    sheetName: SheetName,
    rowIndex: number,
    row: Record<string, unknown>
  ): Promise<void>
  /**
   * Removes one data row. `rowIndex` is 1-based: 1 = first data row (sheet row 2).
   */
  deleteRow(
    spreadsheetId: string,
    sheetName: SheetName,
    rowIndex: number
  ): Promise<void>
  getSheetNames(spreadsheetId: string): Promise<string[]>
  getHeaderRow(spreadsheetId: string, sheetName: string): Promise<string[]>
  createSpreadsheet(): Promise<string>
  /** Full sheet as rows: [header, ...data]. Header row is canonical `SHEET_HEADERS`. */
  readSheetMatrix(
    spreadsheetId: string,
    sheetName: SheetName
  ): Promise<string[][]>
  /** Overwrites the entire sheet from `matrix` (including header row). */
  replaceSheetMatrix(
    spreadsheetId: string,
    sheetName: SheetName,
    matrix: string[][]
  ): Promise<void>
  /** Google Sheets numeric sheetId per tab; empty for CSV/local. */
  getSheetIdMap(
    spreadsheetId: string
  ): Promise<Partial<Record<SheetName, number>>>
}

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

function objectToRow(
  headers: readonly string[],
  obj: Record<string, unknown>
): unknown[] {
  return headers.map((h) => obj[h] ?? '')
}

export class GoogleSheetsRepository implements SheetsRepository {
  private async getSheetNumericId(
    spreadsheetId: string,
    sheetTitle: string
  ): Promise<number> {
    const response = await sheetsFetch(
      `/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${response.status}`)
    }
    const data = (await response.json()) as {
      sheets?: { properties?: { sheetId?: number; title?: string } }[]
    }
    const sheet = data.sheets?.find((s) => s.properties?.title === sheetTitle)
    const id = sheet?.properties?.sheetId
    if (id === undefined) {
      throw new Error(`Sheet not found: ${sheetTitle}`)
    }
    return id
  }

  async readRows<T extends object>(
    spreadsheetId: string,
    sheetName: SheetName
  ): Promise<T[]> {
    const headers = SHEET_HEADERS[sheetName]
    const range = `'${sheetName}'!A:Z`

    const response = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    )

    if (!response.ok) {
      throw new Error(`Failed to read ${sheetName}: ${response.status}`)
    }

    const data = (await response.json()) as { values?: unknown[][] }
    const rows = data.values || []

    if (rows.length < 2) {
      return []
    }

    const dataRows = rows
      .slice(1)
      .filter((row) => row.some((v) => v !== undefined && v !== null && v !== ''))
    const mapped = dataRows.map((row: unknown[]) => rowToObject<T>(headers, row))
    if (sheetName === 'clients') {
      return mapped.filter((c) => {
        const obj = c as Record<string, unknown>
        return obj.id != null && obj.name != null
      })
    }
    return mapped
  }

  async getSheetNames(spreadsheetId: string): Promise<string[]> {
    const metaResponse = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    )

    if (!metaResponse.ok) {
      throw new Error(`Failed to fetch spreadsheet: ${metaResponse.status}`)
    }

    const meta = (await metaResponse.json()) as {
      sheets?: { properties?: { title?: string } }[]
    }
    return (meta.sheets || []).map(
      (s) => s.properties?.title || ''
    )
  }

  async getHeaderRow(
    spreadsheetId: string,
    sheetName: string
  ): Promise<string[]> {
    const range = `'${sheetName}'!1:1`
    const valuesResponse = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    )

    if (!valuesResponse.ok) {
      throw new Error(`Failed to read headers: ${valuesResponse.status}`)
    }

    const valuesData = (await valuesResponse.json()) as {
      values?: unknown[][]
    }
    const headers = valuesData.values?.[0] || []
    return headers.map((h) => String(h ?? ''))
  }

  async appendRows(
    spreadsheetId: string,
    sheetName: SheetName,
    rows: Record<string, unknown>[]
  ): Promise<void> {
    if (rows.length === 0) return
    const headers = SHEET_HEADERS[sheetName]
    const values = rows.map((obj) => objectToRow(headers, obj))
    const range = `'${sheetName}'!A:Z`
    const response = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        body: JSON.stringify({ values }),
      }
    )
    if (!response.ok) {
      throw new Error(`Failed to append ${sheetName}: ${response.status}`)
    }
  }

  async updateRow(
    spreadsheetId: string,
    sheetName: SheetName,
    rowIndex: number,
    row: Record<string, unknown>
  ): Promise<void> {
    if (rowIndex < 1) {
      throw new Error(`Invalid rowIndex: ${rowIndex}`)
    }
    const headers = SHEET_HEADERS[sheetName]
    const values = [objectToRow(headers, row)]
    const sheetRow = rowIndex + 1
    const range = `'${sheetName}'!A${sheetRow}:Z${sheetRow}`
    const response = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        body: JSON.stringify({ values }),
      }
    )
    if (!response.ok) {
      throw new Error(`Failed to update ${sheetName} row: ${response.status}`)
    }
  }

  async deleteRow(
    spreadsheetId: string,
    sheetName: SheetName,
    rowIndex: number
  ): Promise<void> {
    if (rowIndex < 1) {
      throw new Error(`Invalid rowIndex: ${rowIndex}`)
    }
    const sheetId = await this.getSheetNumericId(spreadsheetId, sheetName)
    const startIndex = rowIndex
    const response = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex,
                  endIndex: startIndex + 1,
                },
              },
            },
          ],
        }),
      }
    )
    if (!response.ok) {
      throw new Error(`Failed to delete ${sheetName} row: ${response.status}`)
    }
  }

  async readSheetMatrix(
    spreadsheetId: string,
    sheetName: SheetName
  ): Promise<string[][]> {
    const range = `'${sheetName}'!A:ZZ`
    const response = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    )
    if (!response.ok) {
      throw new Error(`Failed to read matrix ${sheetName}: ${response.status}`)
    }
    const data = (await response.json()) as { values?: unknown[][] }
    return normalizeSheetMatrixFromApi(sheetName, data.values || [])
  }

  async replaceSheetMatrix(
    spreadsheetId: string,
    sheetName: SheetName,
    matrix: string[][]
  ): Promise<void> {
    if (matrix.length === 0) {
      throw new Error(`replaceSheetMatrix: empty matrix for ${sheetName}`)
    }
    const clearRange = encodeURIComponent(`'${sheetName}'!A:ZZ`)
    const clearResponse = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`,
      { method: 'POST', body: '{}' }
    )
    if (!clearResponse.ok) {
      throw new Error(
        `Failed to clear ${sheetName}: ${clearResponse.status}`
      )
    }
    const putRange = encodeURIComponent(`'${sheetName}'!A1`)
    const putResponse = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${putRange}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        body: JSON.stringify({ values: matrix }),
      }
    )
    if (!putResponse.ok) {
      throw new Error(`Failed to write ${sheetName}: ${putResponse.status}`)
    }
  }

  async getSheetIdMap(
    spreadsheetId: string
  ): Promise<Partial<Record<SheetName, number>>> {
    const response = await sheetsFetch(
      `/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
    )
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet ids: ${response.status}`)
    }
    const data = (await response.json()) as {
      sheets?: { properties?: { sheetId?: number; title?: string } }[]
    }
    const map: Partial<Record<SheetName, number>> = {}
    for (const s of data.sheets || []) {
      const title = s.properties?.title
      const id = s.properties?.sheetId
      if (
        title &&
        id !== undefined &&
        (SHEET_NAMES as readonly string[]).includes(title)
      ) {
        map[title as SheetName] = id
      }
    }
    return map
  }

  async createSpreadsheet(): Promise<string> {
    const createResponse = await sheetsFetch(
      'https://sheets.googleapis.com/v4/spreadsheets',
      {
        method: 'POST',
        body: JSON.stringify({
          properties: { title: SPREADSHEET_NAME },
          sheets: SHEET_NAMES.map((sheetName) => ({
            properties: { title: sheetName },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: (SHEET_HEADERS[sheetName] as readonly string[]).map(
                      (header) => ({
                        userEnteredValue: { stringValue: header },
                      })
                    ),
                  },
                ],
              },
            ],
          })),
        }),
      }
    )

    if (!createResponse.ok) {
      const error = (await createResponse.json().catch(() => ({}))) as {
        error?: { message?: string }
      }
      throw new Error(
        error.error?.message || `Failed to create spreadsheet: ${createResponse.status}`
      )
    }

    const result = (await createResponse.json()) as { spreadsheetId?: string }
    const spreadsheetId = result.spreadsheetId
    if (!spreadsheetId) {
      throw new Error('No spreadsheet ID in create response')
    }
    return spreadsheetId
  }
}

export type { ValidationError }

export function getSheetsRepository(): SheetsRepository {
  const backend = getBackend()
  const handle = useBackendStore.getState().localDirectoryHandle
  if (backend === 'local-csv' && handle) {
    return new LocalSheetsRepository()
  }
  return new GoogleSheetsRepository()
}
