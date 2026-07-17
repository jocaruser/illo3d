import {
  SHEET_HEADERS,
  SHEET_NAMES,
  isSheetName,
  type SheetName,
} from '@/Config/schema'
import type {
  SheetMatrix,
  WorkbookRepositoryInterface,
} from '@/Repository/WorkbookRepositoryInterface'
import { parseCsv, serializeCsv } from './Csv'

/**
 * `FileSystemDirectoryHandle.keys()` is missing from the DOM libs this project
 * compiles against; every runtime that grants a directory handle provides it.
 */
type IterableDirectoryHandle = FileSystemDirectoryHandle & {
  keys(): AsyncIterableIterator<string>
}

/**
 * Workbook backend over a local folder (File System Access API): one
 * `<sheet>.csv` file per sheet. The directory handle passed to the
 * constructor is authoritative; `workbookId` parameters are accepted only to
 * satisfy the interface.
 */
export class LocalCsvWorkbookRepository implements WorkbookRepositoryInterface {
  constructor(private readonly directory: FileSystemDirectoryHandle) {}

  async readSheetMatrix(
    _workbookId: string,
    sheet: SheetName
  ): Promise<SheetMatrix> {
    const fileHandle = await this.directory.getFileHandle(`${sheet}.csv`)
    const file = await fileHandle.getFile()
    return parseCsv(await file.text())
  }

  async replaceSheetMatrix(
    _workbookId: string,
    sheet: SheetName,
    matrix: SheetMatrix
  ): Promise<void> {
    await this.writeFile(`${sheet}.csv`, serializeCsv(matrix))
  }

  async getSheetNames(_workbookId: string): Promise<string[]> {
    const names: string[] = []
    for await (const entry of (
      this.directory as IterableDirectoryHandle
    ).keys()) {
      if (!entry.endsWith('.csv')) continue
      const base = entry.slice(0, -'.csv'.length)
      if (isSheetName(base)) names.push(base)
    }
    return names
  }

  async getHeaderRow(workbookId: string, sheet: SheetName): Promise<string[]> {
    const matrix = await this.readSheetMatrix(workbookId, sheet)
    return matrix[0] ?? []
  }

  async createWorkbook(): Promise<string> {
    // One file per sheet, so the header-only writes can run at once.
    await Promise.all(
      SHEET_NAMES.map((sheet) => this.writeHeaderOnlySheet(sheet))
    )
    return `local-${this.directory.name}`
  }

  async ensureSheet(_workbookId: string, sheet: SheetName): Promise<void> {
    try {
      await this.directory.getFileHandle(`${sheet}.csv`)
    } catch {
      await this.writeHeaderOnlySheet(sheet)
    }
  }

  private async writeHeaderOnlySheet(sheet: SheetName): Promise<void> {
    await this.writeFile(
      `${sheet}.csv`,
      serializeCsv([[...SHEET_HEADERS[sheet]]])
    )
  }

  private async writeFile(fileName: string, text: string): Promise<void> {
    const fileHandle = await this.directory.getFileHandle(fileName, {
      create: true,
    })
    const writable = await fileHandle.createWritable()
    await writable.write(text)
    await writable.close()
  }
}
