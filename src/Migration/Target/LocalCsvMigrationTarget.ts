import { METADATA_FILE_NAME, SHEET_NAMES } from '@/Config/schema'
import type { MigrationContext } from '@/Migration/MigrationContext'
import type { MigrationTarget, WorkingCopy } from '@/Migration/MigrationTarget'
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
 * Local CSV migration target. The File System Access API cannot reach a
 * folder's parent, so the working copy lives INSIDE the source folder as a
 * `<YYYY-MM-DD>.v<from>.v<to>.migration` subdirectory; the optional backup
 * becomes a `<YYYY-MM-DD>.v<from>.backup` sibling. Commit copies the migrated
 * CSVs over the source files and writes the flipped metadata LAST — that
 * write is the atomic commit point.
 */
export function createLocalCsvMigrationTarget(
  sourceHandle: FileSystemDirectoryHandle,
  fromVersion: string,
  toVersion: string,
  clock: Clock
): MigrationTarget {
  return {
    async createWorkingCopy(): Promise<WorkingCopy> {
      const workingName = `${isoDay(clock)}.v${fromVersion}.v${toVersion}.migration`
      const workingHandle = await sourceHandle.getDirectoryHandle(workingName, {
        create: true,
      })
      await copyShopFiles(sourceHandle, workingHandle)

      const repo = new LocalCsvWorkbookRepository(workingHandle)
      const workingWorkbookId = `local-${workingName}`
      const ctx: MigrationContext = {
        backend: 'local-csv',
        workingWorkbookId,
        repo,
        ensureSheet: (sheet) => repo.ensureSheet(workingWorkbookId, sheet),
      }

      return {
        ctx,
        async commit({ keepOriginalAsBackup }): Promise<void> {
          if (keepOriginalAsBackup) {
            const backupName = `${isoDay(clock)}.v${fromVersion}.backup`
            const backupHandle = await sourceHandle.getDirectoryHandle(
              backupName,
              { create: true }
            )
            await copyShopFiles(sourceHandle, backupHandle)
          }
          // The migrated CSVs are independent of each other; only the metadata
          // flip below must come after all of them.
          await Promise.all(
            SHEET_NAMES.map((sheet) =>
              copyFileIfPresent(workingHandle, sourceHandle, `${sheet}.csv`)
            )
          )
          const folderRepo = new LocalCsvFolderRepository(sourceHandle)
          const metadata = await folderRepo.readMetadata(sourceHandle.name)
          if (metadata === null) {
            throw new Error(`Source shop is missing ${METADATA_FILE_NAME}`)
          }
          // The atomic commit point: the version flip is the very last write.
          await folderRepo.writeMetadata(sourceHandle.name, {
            ...metadata,
            version: toVersion,
          })
          await sourceHandle.removeEntry(workingName, { recursive: true })
        },
      }
    },
  }
}
