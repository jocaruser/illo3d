import {
  SHEET_HEADERS,
  SHEET_NAMES,
  SPREADSHEET_NAME,
  type SheetName,
} from '@/Config/schema'
import type {
  SheetMatrix,
  WorkbookRepositoryInterface,
} from '@/Repository/WorkbookRepositoryInterface'
import { sheetsFetch } from './GoogleApiClient'

interface ValuesResponse {
  values?: string[][]
}

interface SpreadsheetResponse {
  spreadsheetId?: string
  sheets?: { properties?: { title?: string } }[]
}

function valuesPath(spreadsheetId: string, range: string, suffix = ''): string {
  return `/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}${suffix}`
}

/**
 * Workbook backend over a Google Spreadsheet (Sheets v4): one tab per sheet.
 * `workbookId` is the spreadsheet id.
 */
export class GSheetWorkbookRepository implements WorkbookRepositoryInterface {
  async readSheetMatrix(
    workbookId: string,
    sheet: SheetName
  ): Promise<SheetMatrix> {
    const response = await sheetsFetch(
      valuesPath(workbookId, `'${sheet}'!A:ZZ`, '?majorDimension=ROWS')
    )
    const payload = (await response.json()) as ValuesResponse
    return payload.values ?? [[]]
  }

  async replaceSheetMatrix(
    workbookId: string,
    sheet: SheetName,
    matrix: SheetMatrix
  ): Promise<void> {
    await sheetsFetch(valuesPath(workbookId, `'${sheet}'!A:ZZ`, ':clear'), {
      method: 'POST',
    })
    await this.writeValues(workbookId, sheet, matrix)
  }

  async getSheetNames(workbookId: string): Promise<string[]> {
    const response = await sheetsFetch(
      `/spreadsheets/${workbookId}?fields=sheets.properties.title`
    )
    const payload = (await response.json()) as SpreadsheetResponse
    return (payload.sheets ?? []).map((entry) => entry.properties?.title ?? '')
  }

  async getHeaderRow(workbookId: string, sheet: SheetName): Promise<string[]> {
    const response = await sheetsFetch(valuesPath(workbookId, `'${sheet}'!1:1`))
    const payload = (await response.json()) as ValuesResponse
    return payload.values?.[0] ?? []
  }

  async createWorkbook(): Promise<string> {
    const response = await sheetsFetch('/spreadsheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { title: SPREADSHEET_NAME },
        sheets: SHEET_NAMES.map((title) => ({ properties: { title } })),
      }),
    })
    const payload = (await response.json()) as SpreadsheetResponse
    const spreadsheetId = payload.spreadsheetId ?? ''
    for (const sheet of SHEET_NAMES) {
      await this.writeValues(spreadsheetId, sheet, [[...SHEET_HEADERS[sheet]]])
    }
    return spreadsheetId
  }

  async ensureSheet(workbookId: string, sheet: SheetName): Promise<void> {
    try {
      await sheetsFetch(`/spreadsheets/${workbookId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: sheet } } }],
        }),
      })
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes('already exists')
      )
        throw error
    }
    await this.writeValues(workbookId, sheet, [[...SHEET_HEADERS[sheet]]])
  }

  private async writeValues(
    workbookId: string,
    sheet: SheetName,
    values: SheetMatrix
  ): Promise<void> {
    await sheetsFetch(
      valuesPath(workbookId, `'${sheet}'!A1`, '?valueInputOption=RAW'),
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          range: `'${sheet}'!A1`,
          majorDimension: 'ROWS',
          values,
        }),
      }
    )
  }
}
