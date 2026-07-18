import { METADATA_FILE_NAME, SHEET_NAMES } from '@/Config/schema'
import {
  IN_MEMORY_WORKBOOK_ID,
  InMemoryWorkbookRepository,
} from '@/Migration/InMemoryWorkbookRepository'
import type { MigrationContext } from '@/Migration/MigrationContext'
import type {
  MigrationSession,
  MigrationTarget,
} from '@/Migration/MigrationTarget'
import { LocalCsvFolderRepository } from '@/Repository/LocalCsv/LocalCsvFolderRepository'
import { LocalCsvWorkbookRepository } from '@/Repository/LocalCsv/LocalCsvWorkbookRepository'
import { isoDay, type Clock } from '@/Service/Clock'

async function readFileText(
  dir: FileSystemDirectoryHandle,
  name: string
): Promise<string | null> {
  try {
    const handle = await dir.getFileHandle(name)
    const file = await handle.getFile()
    return await file.text()
  } catch {
    return null
  }
}

async function writeFileText(
  dir: FileSystemDirectoryHandle,
  name: string,
  text: string
): Promise<void> {
  const handle = await dir.getFileHandle(name, { create: true })
  const writable = await handle.createWritable()
  await writable.write(text)
  await writable.close()
}

/** Copy one file between directories; silently skips files absent in `from`. */
async function copyFileIfPresent(
  from: FileSystemDirectoryHandle,
  to: FileSystemDirectoryHandle,
  name: string
): Promise<void> {
  const text = await readFileText(from, name)
  if (text === null) return
  await writeFileText(to, name, text)
}

/** Copy every known sheet CSV (a v1 shop has no audit_log.csv) plus the metadata file. */
async function copyShopFiles(
  from: FileSystemDirectoryHandle,
  to: FileSystemDirectoryHandle
): Promise<void> {
  // Every file is independent, so copy them all at once.
  await Promise.all([
    ...SHEET_NAMES.map((sheet) => copyFileIfPresent(from, to, `${sheet}.csv`)),
    copyFileIfPresent(from, to, METADATA_FILE_NAME),
  ])
}

/**
 * Local CSV migration target (ADR-0012). `open` reads every stored sheet CSV
 * once into an in-memory workbook; the run mutates only that copy. The
 * optional backup is a `<YYYY-MM-DD>.v<from>.backup` subdirectory INSIDE the
 * shop folder (the File System Access API cannot reach a folder's parent),
 * written at the backup step as a copy of the shop as it currently is.
 * `persist` writes the migrated CSVs over the source files and flips the
 * metadata version LAST — that write is the atomic commit point.
 */
export function createLocalCsvMigrationTarget(
  sourceHandle: FileSystemDirectoryHandle,
  fromVersion: string,
  toVersion: string,
  clock: Clock
): MigrationTarget {
  return {
    async open(): Promise<MigrationSession> {
      const sourceId = `local-${sourceHandle.name}`
      const sourceRepo = new LocalCsvWorkbookRepository(sourceHandle)
      const memory = new InMemoryWorkbookRepository()
      const present = new Set(await sourceRepo.getSheetNames(sourceId))
      // Read the stored sheets once; a v1 shop legitimately lacks
      // audit_log.csv, so absent sheets stay absent. Reads are independent —
      // only the load order into memory keeps the canonical sequence.
      const storedSheets = SHEET_NAMES.filter((sheet) => present.has(sheet))
      const matrices = await Promise.all(
        storedSheets.map((sheet) => sourceRepo.readSheetMatrix(sourceId, sheet))
      )
      storedSheets.forEach((sheet, index) => memory.load(sheet, matrices[index]))

      const ctx: MigrationContext = {
        backend: 'local-csv',
        workingWorkbookId: IN_MEMORY_WORKBOOK_ID,
        repo: memory,
        ensureSheet: (sheet) => memory.ensureSheet(IN_MEMORY_WORKBOOK_ID, sheet),
      }

      return {
        ctx,
        async writeBackup(): Promise<void> {
          const backupName = `${isoDay(clock)}.v${fromVersion}.backup`
          const backupHandle = await sourceHandle.getDirectoryHandle(
            backupName,
            { create: true }
          )
          await copyShopFiles(sourceHandle, backupHandle)
        },
        async persist(): Promise<void> {
          const folderRepo = new LocalCsvFolderRepository(sourceHandle)
          const metadata = await folderRepo.readMetadata(sourceHandle.name)
          if (metadata === null) {
            throw new Error(`Source shop is missing ${METADATA_FILE_NAME}`)
          }
          // The migrated sheets are independent of each other; only the
          // metadata flip below must come after all of them.
          await Promise.all(
            memory
              .entries()
              .map(([sheet, matrix]) =>
                sourceRepo.replaceSheetMatrix(sourceId, sheet, matrix)
              )
          )
          // The atomic commit point: the version flip is the very last write.
          await folderRepo.writeMetadata(sourceHandle.name, {
            ...metadata,
            version: toVersion,
          })
        },
      }
    },
  }
}
