import type { SheetsRepository } from '@/services/sheets/repository'
import {
  SHEET_NAMES,
  SHEET_HEADERS,
  type SheetName,
} from '@/services/sheets/config'
import { normalizeSheetMatrixFromCsvLines, parseCsvLine } from '@/services/sheets/sheetMatrix'
import { sanitizeFixtureFolderId } from './csvFixtureUtils'

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

  private parseCsv<T extends object>(
    csvText: string,
    headers: readonly string[]
  ): T[] {
    const lines = csvText.trim().split(/\r?\n/)
    if (lines.length < 2) return []
    const dataRows = lines.slice(1).filter((line) => line.trim() !== '')
    return dataRows.map((line) => {
      const values = parseCsvLine(line)
      const obj = {} as T
      headers.forEach((header, i) => {
        const value = values[i]
        if (value !== undefined && value !== null && value !== '') {
          ;(obj as Record<string, unknown>)[header] = value
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
    const rows = this.parseCsv<T>(csvText, headers)
    if (sheetName === 'clients') {
      return rows.filter((c) => {
        const obj = c as Record<string, unknown>
        return obj.id != null && obj.name != null
      })
    }
    return rows
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
    return parseCsvLine(firstLine)
  }

  async appendRows(
    spreadsheetId: string,
    sheetName: SheetName,
    rows: Record<string, unknown>[]
  ): Promise<void> {
    if (rows.length === 0) return
    const folder = this.folderFromSpreadsheetId(spreadsheetId)
    const response = await fetch('/api/sheets/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId,
        folder,
        sheetName,
        rows,
      }),
    })
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
    const folder = this.folderFromSpreadsheetId(spreadsheetId)
    const response = await fetch('/api/sheets/row', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId,
        folder,
        sheetName,
        rowIndex,
        row,
      }),
    })
    if (!response.ok) {
      throw new Error(`Failed to update ${sheetName}: ${response.status}`)
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
    const folder = this.folderFromSpreadsheetId(spreadsheetId)
    const response = await fetch('/api/sheets/row', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId,
        folder,
        sheetName,
        rowIndex,
      }),
    })
    if (!response.ok) {
      throw new Error(`Failed to delete ${sheetName}: ${response.status}`)
    }
  }

  async readSheetMatrix(
    spreadsheetId: string,
    sheetName: SheetName
  ): Promise<string[][]> {
    const folder = this.folderFromSpreadsheetId(spreadsheetId)
    const csvText = await this.fetchCsv(sheetName, folder)
    const lines = csvText.trimEnd().split(/\r?\n/)
    return normalizeSheetMatrixFromCsvLines(sheetName, lines)
  }

  async replaceSheetMatrix(
    spreadsheetId: string,
    sheetName: SheetName,
    matrix: string[][]
  ): Promise<void> {
    if (matrix.length === 0) {
      throw new Error(`replaceSheetMatrix: empty matrix for ${sheetName}`)
    }
    const folder = this.folderFromSpreadsheetId(spreadsheetId)
    const response = await fetch('/api/sheets/replace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId,
        folder,
        sheetName,
        matrix,
      }),
    })
    if (!response.ok) {
      throw new Error(`Failed to replace ${sheetName}: ${response.status}`)
    }
  }

  async clearSheet(
    spreadsheetId: string,
    sheetName: SheetName
  ): Promise<void> {
    void spreadsheetId
    void sheetName
    // Not implemented for CSV backend
  }

  async getSheetIdMap(
    spreadsheetId: string
  ): Promise<Partial<Record<SheetName, number>>> {
    void spreadsheetId
    return {}
  }

  async createSpreadsheet(): Promise<string> {
    return 'csv-dev'
  }
}
