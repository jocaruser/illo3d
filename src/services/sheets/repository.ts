import { isCsvBackendEnabled, sanitizeFixtureFolderId } from '@/config/csvBackend'
import { getAccessToken } from './client'
import { sheetsFetch } from './client'
import {
  SPREADSHEET_NAME,
  SHEET_NAMES,
  SHEET_HEADERS,
  type SheetName,
} from './config'
import type { ValidationError } from './validateStructure'

export interface SheetsRepository {
  readRows<T extends object>(
    spreadsheetId: string,
    sheetName: SheetName
  ): Promise<T[]>
  getSheetNames(spreadsheetId: string): Promise<string[]>
  getHeaderRow(spreadsheetId: string, sheetName: string): Promise<string[]>
  createSpreadsheet(): Promise<string>
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

export class GoogleSheetsRepository implements SheetsRepository {
  async readRows<T extends object>(
    spreadsheetId: string,
    sheetName: SheetName
  ): Promise<T[]> {
    const accessToken = await getAccessToken()
    const headers = SHEET_HEADERS[sheetName]
    const range = `'${sheetName}'!A:Z`

    const response = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      accessToken
    )

    if (!response.ok) {
      throw new Error(`Failed to read ${sheetName}: ${response.status}`)
    }

    const data = (await response.json()) as { values?: unknown[][] }
    const rows = data.values || []

    if (rows.length < 2) {
      return []
    }

    const dataRows = rows.slice(1)
    return dataRows.map((row: unknown[]) => rowToObject<T>(headers, row))
  }

  async getSheetNames(spreadsheetId: string): Promise<string[]> {
    const accessToken = await getAccessToken()
    const metaResponse = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      accessToken
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
    const accessToken = await getAccessToken()
    const range = `'${sheetName}'!1:1`
    const valuesResponse = await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      accessToken
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

  async createSpreadsheet(): Promise<string> {
    const accessToken = await getAccessToken()
    const createResponse = await sheetsFetch(
      'https://sheets.googleapis.com/v4/spreadsheets',
      accessToken,
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

const DEFAULT_FIXTURE_FOLDER = 'happy-path'

export class CsvSheetsRepository implements SheetsRepository {
  private readonly folderName: string

  constructor(folderName?: string) {
    this.folderName = folderName ?? DEFAULT_FIXTURE_FOLDER
  }

  private csvUrl(sheetName: string, folder?: string): string {
    const f = folder ?? this.folderName
    const safe = sanitizeFixtureFolderId(f)
    if (!safe) {
      throw new Error(`Invalid fixture folder: ${f}`)
    }
    return `/fixtures/${safe}/${sheetName}.csv`
  }

  private async fetchCsv(sheetName: string, folder?: string): Promise<string> {
    const url = this.csvUrl(sheetName, folder)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sheetName}: ${response.status}`)
    }
    return response.text()
  }

  /**
   * Parse simple CSV. Limitation: uses split(',') — does not handle quoted values
   * containing commas (e.g. "Acme, Inc."). Current fixtures avoid embedded commas.
   */
  private parseCsv<T extends object>(
    csvText: string,
    headers: readonly string[]
  ): T[] {
    const lines = csvText.trim().split(/\r?\n/)
    if (lines.length < 2) return []
    const dataRows = lines.slice(1)
    return dataRows.map((line) => {
      const values = line.split(',')
      const obj = {} as T
      headers.forEach((header, i) => {
        const value = values[i]
        if (value !== undefined && value !== null && value !== '') {
          ;(obj as Record<string, unknown>)[header] = value.trim()
        }
      })
      return obj
    })
  }

  private folderFromSpreadsheetId(spreadsheetId: string): string {
    const prefix = 'csv-fixture-'
    if (spreadsheetId.startsWith(prefix)) {
      return spreadsheetId.slice(prefix.length)
    }
    return this.folderName
  }

  async readRows<T extends object>(
    spreadsheetId: string,
    sheetName: SheetName
  ): Promise<T[]> {
    const folder = this.folderFromSpreadsheetId(spreadsheetId)
    const headers = SHEET_HEADERS[sheetName]
    const csvText = await this.fetchCsv(sheetName, folder)
    return this.parseCsv<T>(csvText, headers)
  }

  async getSheetNames(spreadsheetId: string): Promise<string[]> {
    void spreadsheetId // CSV mode: folder can be derived; not needed for SHEET_NAMES
    return [...SHEET_NAMES]
  }

  async getHeaderRow(
    spreadsheetId: string,
    sheetName: string
  ): Promise<string[]> {
    const folder = this.folderFromSpreadsheetId(spreadsheetId)
    const csvText = await this.fetchCsv(sheetName, folder)
    const firstLine = csvText.trim().split(/\r?\n/)[0] || ''
    return firstLine.split(',').map((h) => h.trim())
  }

  async createSpreadsheet(): Promise<string> {
    return 'csv-dev'
  }
}

export function getSheetsRepository(): SheetsRepository {
  if (isCsvBackendEnabled()) {
    return new CsvSheetsRepository()
  }
  return new GoogleSheetsRepository()
}

export const sheetsRepository: SheetsRepository = getSheetsRepository()
