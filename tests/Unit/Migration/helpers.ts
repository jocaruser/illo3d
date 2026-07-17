import {
  METADATA_FILE_NAME,
  SHEET_HEADERS,
  type SheetName,
} from '@/Config/schema'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import type { MigrationContext } from '@/Migration/MigrationContext'
import type { ProgressReporter } from '@/Migration/MigrationStep'
import type { FolderRepositoryInterface } from '@/Repository/FolderRepositoryInterface'
import type {
  SheetMatrix,
  WorkbookRepositoryInterface,
} from '@/Repository/WorkbookRepositoryInterface'
import type { Clock } from '@/Service/Clock'

/** Map-backed workbook fake for exercising steps without any storage layer. */
export class InMemoryWorkbookRepository implements WorkbookRepositoryInterface {
  readonly sheets = new Map<string, SheetMatrix>()

  async readSheetMatrix(
    _workbookId: string,
    sheet: SheetName
  ): Promise<SheetMatrix> {
    const matrix = this.sheets.get(sheet)
    if (!matrix) throw new Error(`Missing sheet '${sheet}'`)
    return matrix.map((row) => [...row])
  }

  async replaceSheetMatrix(
    _workbookId: string,
    sheet: SheetName,
    matrix: SheetMatrix
  ): Promise<void> {
    this.sheets.set(
      sheet,
      matrix.map((row) => [...row])
    )
  }

  async getSheetNames(_workbookId: string): Promise<string[]> {
    return [...this.sheets.keys()]
  }

  async getHeaderRow(workbookId: string, sheet: SheetName): Promise<string[]> {
    return (await this.readSheetMatrix(workbookId, sheet))[0] ?? []
  }

  async createWorkbook(): Promise<string> {
    return 'in-memory'
  }

  async ensureSheet(_workbookId: string, sheet: SheetName): Promise<void> {
    if (!this.sheets.has(sheet))
      this.sheets.set(sheet, [[...SHEET_HEADERS[sheet]]])
  }
}

export function contextFor(
  repo: WorkbookRepositoryInterface,
  workingWorkbookId = 'wb'
): MigrationContext {
  return {
    backend: 'local-csv',
    workingWorkbookId,
    repo,
    ensureSheet: (sheet) => repo.ensureSheet(workingWorkbookId, sheet),
  }
}

export class RecordingReporter implements ProgressReporter {
  readonly keys: string[] = []

  update(i18nKey: string): void {
    this.keys.push(i18nKey)
  }
}

export class FixedClock implements Clock {
  constructor(private readonly iso: string) {}

  now(): Date {
    return new Date(this.iso)
  }
}

/** In-memory File System Access API fake: files as Map<string, string>, subdirs nested. */
export class FakeDirectoryHandle {
  readonly kind = 'directory'
  readonly files = new Map<string, string>()
  readonly dirs = new Map<string, FakeDirectoryHandle>()

  constructor(readonly name = 'shop') {}

  async getFileHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FakeFileHandle> {
    if (!this.files.has(name)) {
      if (!options?.create) throw new Error(`NotFoundError: file '${name}'`)
      this.files.set(name, '')
    }
    return new FakeFileHandle(this, name)
  }

  async getDirectoryHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FakeDirectoryHandle> {
    let dir = this.dirs.get(name)
    if (!dir) {
      if (!options?.create)
        throw new Error(`NotFoundError: directory '${name}'`)
      dir = new FakeDirectoryHandle(name)
      this.dirs.set(name, dir)
    }
    return dir
  }

  async removeEntry(
    name: string,
    _options?: { recursive?: boolean }
  ): Promise<void> {
    if (this.dirs.delete(name) || this.files.delete(name)) return
    throw new Error(`NotFoundError: entry '${name}'`)
  }

  asHandle(): FileSystemDirectoryHandle {
    return this as unknown as FileSystemDirectoryHandle
  }
}

export class FakeFileHandle {
  readonly kind = 'file'

  constructor(
    private readonly dir: FakeDirectoryHandle,
    private readonly fileName: string
  ) {}

  async getFile(): Promise<{ text(): Promise<string> }> {
    const content = this.dir.files.get(this.fileName) ?? ''
    return { text: async () => content }
  }

  async createWritable(): Promise<{
    write(chunk: string): Promise<void>
    close(): Promise<void>
  }> {
    let buffer = ''
    return {
      write: async (chunk: string) => {
        buffer += chunk
      },
      close: async () => {
        this.dir.files.set(this.fileName, buffer)
      },
    }
  }
}

/**
 * Sheet-file codec used by the fake LocalCsv repositories below. The migration
 * target copies file contents verbatim, so the format is opaque to the code
 * under test — JSON keeps the fake trivially exact (commas, quotes, JSON cells).
 */
export function encodeSheet(matrix: SheetMatrix): string {
  return JSON.stringify(matrix)
}

export function decodeSheet(text: string): SheetMatrix {
  return JSON.parse(text) as SheetMatrix
}

/** Stand-in for the parallel-agent LocalCsvWorkbookRepository, wired to FakeDirectoryHandle. */
export class FakeLocalCsvWorkbookRepository implements WorkbookRepositoryInterface {
  constructor(private readonly directory: FileSystemDirectoryHandle) {}

  private get dir(): FakeDirectoryHandle {
    return this.directory as unknown as FakeDirectoryHandle
  }

  async readSheetMatrix(
    _workbookId: string,
    sheet: SheetName
  ): Promise<SheetMatrix> {
    const text = this.dir.files.get(`${sheet}.csv`)
    if (text === undefined) throw new Error(`Missing sheet '${sheet}'`)
    return decodeSheet(text)
  }

  async replaceSheetMatrix(
    _workbookId: string,
    sheet: SheetName,
    matrix: SheetMatrix
  ): Promise<void> {
    this.dir.files.set(`${sheet}.csv`, encodeSheet(matrix))
  }

  async getSheetNames(_workbookId: string): Promise<string[]> {
    return [...this.dir.files.keys()]
      .filter((n) => n.endsWith('.csv'))
      .map((n) => n.slice(0, -4))
  }

  async getHeaderRow(workbookId: string, sheet: SheetName): Promise<string[]> {
    return (await this.readSheetMatrix(workbookId, sheet))[0] ?? []
  }

  async createWorkbook(): Promise<string> {
    return 'local-fake'
  }

  async ensureSheet(_workbookId: string, sheet: SheetName): Promise<void> {
    if (!this.dir.files.has(`${sheet}.csv`)) {
      this.dir.files.set(
        `${sheet}.csv`,
        encodeSheet([[...SHEET_HEADERS[sheet]]])
      )
    }
  }
}

/** Stand-in for the parallel-agent LocalCsvFolderRepository, wired to FakeDirectoryHandle. */
export class FakeLocalCsvFolderRepository implements FolderRepositoryInterface {
  constructor(private readonly directory: FileSystemDirectoryHandle) {}

  private get dir(): FakeDirectoryHandle {
    return this.directory as unknown as FakeDirectoryHandle
  }

  async readMetadata(_folderId: string): Promise<ShopMetadata | null> {
    const text = this.dir.files.get(METADATA_FILE_NAME)
    if (text === undefined) return null
    return JSON.parse(text) as ShopMetadata
  }

  async writeMetadata(
    _folderId: string,
    metadata: ShopMetadata
  ): Promise<void> {
    this.dir.files.set(METADATA_FILE_NAME, JSON.stringify(metadata))
  }

  async getFolderName(_folderId: string): Promise<string> {
    return this.dir.name
  }
}

/** Canonical header minus lifecycle and v3 additions — the shape a v1 shop stored. */
export function v1Header(sheet: SheetName): string[] {
  const dropped = ['archived', 'deleted', 'due_date', 'colour']
  return SHEET_HEADERS[sheet].filter((column) => !dropped.includes(column))
}

export function shopMetadata(version: string): ShopMetadata {
  return {
    app: 'illo3d',
    version,
    spreadsheetId: 'sheet-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    createdBy: 'tester',
    logo: 'logo.png',
  }
}
