import { LocalSheetsRepository } from '@/services/local/LocalSheetsRepository'
import { SHEET_HEADERS, type SheetName } from '@/services/sheets/config'
import type { ShopMetadata } from '@/types/shop'
import type {
  CommitOptions,
  MigrationTarget,
  WorkingCopy,
} from '../MigrationTarget'

const METADATA_FILENAME = 'illo3d.metadata.json'

export interface LocalMigrationTargetParams {
  shopHandle: FileSystemDirectoryHandle
  fromVersion: string
  toVersion: string
}

export function createLocalMigrationTarget(
  params: LocalMigrationTargetParams
): MigrationTarget {
  return {
    async createWorkingCopy(): Promise<WorkingCopy> {
      const workingName = workingFolderName(params)
      const workingHandle = await params.shopHandle.getDirectoryHandle(
        workingName,
        { create: true }
      )
      await copyFilesBetweenFolders(params.shopHandle, workingHandle)
      return {
        ctx: {
          backend: 'local-csv',
          workingSpreadsheetId: `local-${workingName}`,
          repo: new LocalSheetsRepository(workingHandle),
          ensureSheet: (sheetName) => ensureCsvSheet(workingHandle, sheetName),
        },
        commit: (options) =>
          commitWorkingCopy(params, workingHandle, workingName, options),
      }
    },
  }
}

function workingFolderName(params: LocalMigrationTargetParams): string {
  return `${datestamp()}.v${params.fromVersion}.v${params.toVersion}.migration`
}

function backupFolderName(params: LocalMigrationTargetParams): string {
  return `${datestamp()}.v${params.fromVersion}.backup`
}

function datestamp(): string {
  return new Date().toISOString().slice(0, 10)
}

async function commitWorkingCopy(
  params: LocalMigrationTargetParams,
  workingHandle: FileSystemDirectoryHandle,
  workingName: string,
  options: CommitOptions
): Promise<void> {
  if (options.keepOriginalAsBackup) {
    const backupHandle = await params.shopHandle.getDirectoryHandle(
      backupFolderName(params),
      { create: true }
    )
    await copyFilesBetweenFolders(params.shopHandle, backupHandle)
  }
  await copyFilesBetweenFolders(workingHandle, params.shopHandle, {
    skip: [METADATA_FILENAME],
  })
  await writeMigratedMetadata(params, workingHandle)
  await params.shopHandle.removeEntry(workingName, { recursive: true })
}

// Writing the metadata version flip last makes it the commit point: until it
// lands, validation still reports the shop as v1 and the working copy remains.
async function writeMigratedMetadata(
  params: LocalMigrationTargetParams,
  workingHandle: FileSystemDirectoryHandle
): Promise<void> {
  const metadata = JSON.parse(
    await readFileText(workingHandle, METADATA_FILENAME)
  ) as ShopMetadata
  const migrated: ShopMetadata = { ...metadata, version: params.toVersion }
  await writeFileText(
    params.shopHandle,
    METADATA_FILENAME,
    JSON.stringify(migrated, null, 2)
  )
}

async function ensureCsvSheet(
  handle: FileSystemDirectoryHandle,
  sheetName: SheetName
): Promise<void> {
  const csvName = `${sheetName}.csv`
  try {
    await handle.getFileHandle(csvName)
  } catch {
    await writeFileText(handle, csvName, SHEET_HEADERS[sheetName].join(',') + '\n')
  }
}

interface CopyOptions {
  skip?: string[]
}

async function copyFilesBetweenFolders(
  source: FileSystemDirectoryHandle,
  destination: FileSystemDirectoryHandle,
  options: CopyOptions = {}
): Promise<void> {
  for (const name of await listFileNames(source)) {
    if (options.skip?.includes(name)) continue
    const content = await readFileText(source, name)
    await writeFileText(destination, name, content)
  }
}

// tsconfig lib lacks DOM.AsyncIterable, so directory iteration needs a local shape.
interface IterableDirectoryHandle {
  entries(): AsyncIterable<[string, { kind: 'file' | 'directory' }]>
}

async function listFileNames(
  handle: FileSystemDirectoryHandle
): Promise<string[]> {
  const names: string[] = []
  const iterable = handle as unknown as IterableDirectoryHandle
  for await (const [name, entry] of iterable.entries()) {
    if (entry.kind === 'file') names.push(name)
  }
  return names
}

async function readFileText(
  handle: FileSystemDirectoryHandle,
  name: string
): Promise<string> {
  const fileHandle = await handle.getFileHandle(name)
  const file = await fileHandle.getFile()
  return file.text()
}

async function writeFileText(
  handle: FileSystemDirectoryHandle,
  name: string,
  content: string
): Promise<void> {
  const fileHandle = await handle.getFileHandle(name, { create: true })
  const writable = await fileHandle.createWritable({ keepExistingData: false })
  await writable.write(content)
  await writable.close()
}
