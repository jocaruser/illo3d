import {
  METADATA_FILE_NAME,
  SHEET_NAMES,
  SPREADSHEET_NAME,
} from '@/Config/schema'
import {
  IN_MEMORY_WORKBOOK_ID,
  InMemoryWorkbookRepository,
} from '@/Migration/InMemoryWorkbookRepository'
import type { MigrationContext } from '@/Migration/MigrationContext'
import type {
  MigrationSession,
  MigrationTarget,
} from '@/Migration/MigrationTarget'
import { copyFile } from '@/Repository/GSheet/DriveFiles'
import { GDriveFolderRepository } from '@/Repository/GSheet/GDriveFolderRepository'
import { GSheetWorkbookRepository } from '@/Repository/GSheet/GSheetWorkbookRepository'
import type { Clock } from '@/Service/Clock'

/**
 * Google Drive migration target (ADR-0012). `open` reads every stored tab of
 * the source spreadsheet once into an in-memory workbook; the run mutates only
 * that copy. The optional backup is a Drive copy of the spreadsheet named
 * `illo3d-data.v<from>.backup` in the shop folder, written at the backup step
 * as a copy of the shop as it currently is. `persist` rewrites the source
 * spreadsheet's tabs in place (creating tabs the migration added) and flips
 * the metadata version LAST — that single write is the atomic commit point.
 */
export function createGSheetMigrationTarget(
  folderId: string,
  sourceSpreadsheetId: string,
  fromVersion: string,
  toVersion: string,
  _clock: Clock
): MigrationTarget {
  return {
    async open(): Promise<MigrationSession> {
      const sourceRepo = new GSheetWorkbookRepository()
      const memory = new InMemoryWorkbookRepository()
      const present = new Set(
        await sourceRepo.getSheetNames(sourceSpreadsheetId)
      )
      // Read the stored tabs once; a v1 shop legitimately lacks the
      // audit_log tab, so absent tabs stay absent. Reads are independent —
      // only the load order into memory keeps the canonical sequence.
      const storedSheets = SHEET_NAMES.filter((sheet) => present.has(sheet))
      const matrices = await Promise.all(
        storedSheets.map((sheet) =>
          sourceRepo.readSheetMatrix(sourceSpreadsheetId, sheet)
        )
      )
      storedSheets.forEach((sheet, index) => memory.load(sheet, matrices[index]))

      const ctx: MigrationContext = {
        backend: 'google-drive',
        workingWorkbookId: IN_MEMORY_WORKBOOK_ID,
        repo: memory,
        ensureSheet: (sheet) => memory.ensureSheet(IN_MEMORY_WORKBOOK_ID, sheet),
      }

      return {
        ctx,
        async writeBackup(): Promise<void> {
          await copyFile(
            sourceSpreadsheetId,
            `${SPREADSHEET_NAME}.v${fromVersion}.backup`,
            folderId
          )
        },
        async persist(): Promise<void> {
          const folderRepo = new GDriveFolderRepository()
          const metadata = await folderRepo.readMetadata(folderId)
          if (metadata === null) {
            throw new Error(`Source shop is missing ${METADATA_FILE_NAME}`)
          }
          // The migrated tabs are independent of each other; only the
          // metadata flip below must come after all of them. Tabs the
          // migration created (e.g. audit_log on a v1 shop) are added first.
          await Promise.all(
            memory.entries().map(async ([sheet, matrix]) => {
              if (!present.has(sheet)) {
                await sourceRepo.ensureSheet(sourceSpreadsheetId, sheet)
              }
              await sourceRepo.replaceSheetMatrix(
                sourceSpreadsheetId,
                sheet,
                matrix
              )
            })
          )
          // The atomic commit point: the version flip is the very last write.
          await folderRepo.writeMetadata(folderId, {
            ...metadata,
            version: toVersion,
          })
        },
      }
    },
  }
}
