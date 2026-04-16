import {
  SHEET_NAMES,
  SHEET_HEADERS,
  type SheetName,
} from '@/services/sheets/config'
import type { SheetsRepository } from '@/services/sheets/repository'
import { normalizeSheetMatrixFromCsvLines } from '@/services/sheets/sheetMatrix'
import { useAuthStore } from '@/stores/authStore'
import { useBackendStore } from '@/stores/backendStore'
import { APP_VERSION } from '@/config/version'

const METADATA_FILENAME = 'illo3d.metadata.json'
const LOCAL_PREFIX = 'local-'

function escapeCsvValue(val: unknown): string {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export class LocalSheetsRepository implements SheetsRepository {
  private getHandle(): FileSystemDirectoryHandle {
    const handle = useBackendStore.getState().localDirectoryHandle
    if (!handle) throw new Error('No local directory handle set')
    return handle
  }

  private async readFile(handle: FileSystemDirectoryHandle, name: string): Promise<string> {
    const fileHandle = await handle.getFileHandle(name)
    const file = await fileHandle.getFile()
    return file.text()
  }

  private async writeFile(handle: FileSystemDirectoryHandle, name: string, content: string): Promise<void> {
    const fileHandle = await handle.getFileHandle(name, { create: true })
    const writable = await fileHandle.createWritable({ keepExistingData: false })
    await writable.write(content)
    await writable.close()
  }

  async readRows<T extends object>(
    _spreadsheetId: string,
    sheetName: SheetName
  ): Promise<T[]> {
    const handle = this.getHandle()
    const csvName = `${sheetName}.csv`
    const csvText = await this.readFile(handle, csvName)
    const headers = SHEET_HEADERS[sheetName]
    const lines = csvText.trim().split(/\r?\n/)
    if (lines.length < 2) return []
    const dataRows = lines.slice(1)
    return dataRows.map((line) => {
      const values = line.split(',').map((v) => v.trim())
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

  async getSheetNames(spreadsheetId: string): Promise<string[]> {
    void spreadsheetId
    return [...SHEET_NAMES]
  }

  async getHeaderRow(_spreadsheetId: string, sheetName: string): Promise<string[]> {
    const handle = this.getHandle()
    const csvName = `${sheetName}.csv`
    const csvText = await this.readFile(handle, csvName)
    const firstLine = csvText.trim().split(/\r?\n/)[0] ?? ''
    return firstLine.split(',').map((h) => h.trim())
  }

  async appendRows(
    _spreadsheetId: string,
    sheetName: SheetName,
    rows: Record<string, unknown>[]
  ): Promise<void> {
    if (rows.length === 0) return
    const handle = this.getHandle()
    const headers = SHEET_HEADERS[sheetName]
    const csvName = `${sheetName}.csv`
    let existing = ''
    try {
      existing = await this.readFile(handle, csvName)
    } catch {
      existing = headers.map((h) => escapeCsvValue(h)).join(',') + '\n'
    }
    const toAppend = rows
      .map((obj) =>
        headers.map((h) => escapeCsvValue(obj[h])).join(',')
      )
      .join('\n')
    const fileHandle = await handle.getFileHandle(csvName, { create: true })
    const writable = await fileHandle.createWritable({ keepExistingData: true })
    await writable.seek(existing.length)
    await writable.write('\n' + toAppend)
    await writable.close()
  }

  async updateRow(
    _spreadsheetId: string,
    sheetName: SheetName,
    rowIndex: number,
    row: Record<string, unknown>
  ): Promise<void> {
    if (rowIndex < 1) {
      throw new Error(`Invalid rowIndex: ${rowIndex}`)
    }
    const handle = this.getHandle()
    const headers = SHEET_HEADERS[sheetName]
    const csvName = `${sheetName}.csv`
    const csvText = await this.readFile(handle, csvName)
    const lines = csvText.trimEnd().split(/\r?\n/)
    const lineIdx = rowIndex
    if (lineIdx >= lines.length) {
      throw new Error(`Row ${rowIndex} out of range for ${sheetName}`)
    }
    const newLine = headers.map((h) => escapeCsvValue(row[h])).join(',')
    lines[lineIdx] = newLine
    await this.writeFile(handle, csvName, lines.join('\n') + '\n')
  }

  async deleteRow(
    _spreadsheetId: string,
    sheetName: SheetName,
    rowIndex: number
  ): Promise<void> {
    if (rowIndex < 1) {
      throw new Error(`Invalid rowIndex: ${rowIndex}`)
    }
    const handle = this.getHandle()
    const csvName = `${sheetName}.csv`
    const csvText = await this.readFile(handle, csvName)
    const lines = csvText.trimEnd().split(/\r?\n/)
    const lineIdx = rowIndex
    if (lineIdx >= lines.length) {
      throw new Error(`Row ${rowIndex} out of range for ${sheetName}`)
    }
    lines.splice(lineIdx, 1)
    await this.writeFile(handle, csvName, lines.join('\n') + '\n')
  }

  async readSheetMatrix(
    spreadsheetId: string,
    sheetName: SheetName
  ): Promise<string[][]> {
    void spreadsheetId
    const handle = this.getHandle()
    const csvText = await this.readFile(handle, `${sheetName}.csv`)
    const lines = csvText.trimEnd().split(/\r?\n/)
    return normalizeSheetMatrixFromCsvLines(sheetName, lines)
  }

  async replaceSheetMatrix(
    spreadsheetId: string,
    sheetName: SheetName,
    matrix: string[][]
  ): Promise<void> {
    void spreadsheetId
    if (matrix.length === 0) {
      throw new Error(`replaceSheetMatrix: empty matrix for ${sheetName}`)
    }
    const handle = this.getHandle()
    const csvName = `${sheetName}.csv`
    const body =
      matrix.map((row) => row.map((c) => escapeCsvValue(c)).join(',')).join('\n') +
      '\n'
    await this.writeFile(handle, csvName, body)
  }

  async getSheetIdMap(
    spreadsheetId: string
  ): Promise<Partial<Record<SheetName, number>>> {
    void spreadsheetId
    return {}
  }

  async createSpreadsheet(): Promise<string> {
    const handle = this.getHandle()
    const folderName = handle.name
    const spreadsheetId = LOCAL_PREFIX + folderName

    const user = useAuthStore.getState().user
    const metadata = {
      app: 'illo3d',
      version: APP_VERSION,
      spreadsheetId,
      createdAt: new Date().toISOString(),
      createdBy: user?.email ?? 'local',
    }
    await this.writeFile(handle, METADATA_FILENAME, JSON.stringify(metadata, null, 2))

    for (const sheetName of SHEET_NAMES) {
      const headers = SHEET_HEADERS[sheetName]
      const headerLine = headers.map((h) => escapeCsvValue(h)).join(',')
      await this.writeFile(handle, `${sheetName}.csv`, headerLine + '\n')
    }

    return spreadsheetId
  }
}
