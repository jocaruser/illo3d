import { METADATA_FILE_NAME, SHEET_NAMES } from '@/Config/schema'
import type { MigrationContext } from '@/Migration/MigrationContext'
import type {
  MigrationSession,
  MigrationTarget,
} from '@/Migration/MigrationTarget'
import { parseCsv, serializeCsv } from '@/Repository/LocalCsv/Csv'
import { LocalCsvFolderRepository } from '@/Repository/LocalCsv/LocalCsvFolderRepository'
import { InMemoryWorkbookRepository } from '@/Repository/InMemoryWorkbookRepository'
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
  await Promise.all([
    ...SHEET_NAMES.map((sheet) => copyFileIfPresent(from, to, `${sheet}.csv`)),
    copyFileIfPresent(from, to, METADATA_FILE_NAME),
  ])
}

async function loadShopIntoMemory(
  sourceHandle: FileSystemDirectoryHandle,
  workbookId: string,
  repo: InMemoryWorkbookRepository
): Promise<void> {
  await Promise.all(
    SHEET_NAMES.map(async (sheet) => {
      const text = await readFileText(sourceHandle, `${sheet}.csv`)
      if (text === null) return
      await repo.replaceSheetMatrix(workbookId, sheet, parseCsv(text))
    })
  )
}

/**
 * Local CSV migration target. Steps run against an in-memory workbook loaded
 * from the source folder; optional backup is a sibling directory; submit copies
 * upgraded sheets over the source files and flips metadata last.
 */
export function createLocalCsvMigrationTarget(
  sourceHandle: FileSystemDirectoryHandle,
  fromVersion: string,
  toVersion: string,
  clock: Clock
): MigrationTarget {
  return {
    async writePreUpgradeBackup(): Promise<void> {
      const backupName = `${isoDay(clock)}.v${fromVersion}.backup`
      const backupHandle = await sourceHandle.getDirectoryHandle(backupName, {
        create: true,
      })
      await copyShopFiles(sourceHandle, backupHandle)
    },

    async openSession(): Promise<MigrationSession> {
      const repo = new InMemoryWorkbookRepository()
      const workingWorkbookId = `local-session-${isoDay(clock)}`
      await loadShopIntoMemory(sourceHandle, workingWorkbookId, repo)
      const ctx: MigrationContext = {
        backend: 'local-csv',
        workingWorkbookId,
        repo,
        ensureSheet: (sheet) => repo.ensureSheet(workingWorkbookId, sheet),
      }

      return {
        ctx,
        async submit(_options): Promise<void> {
          await Promise.all(
            SHEET_NAMES.map(async (sheet) => {
              if (!repo.sheets.has(sheet)) return
              const matrix = await repo.readSheetMatrix(
                workingWorkbookId,
                sheet
              )
              await writeFileText(
                sourceHandle,
                `${sheet}.csv`,
                serializeCsv(matrix)
              )
            })
          )
          const folderRepo = new LocalCsvFolderRepository(sourceHandle)
          const outcome = await folderRepo.readMetadata(sourceHandle.name)
          if (outcome.kind !== 'present') {
            throw new Error(`Source shop is missing ${METADATA_FILE_NAME}`)
          }
          await folderRepo.writeMetadata(sourceHandle.name, {
            ...outcome.metadata,
            version: toVersion,
          })
        },
      }
    },
  }
}
