import { METADATA_FILE_NAME, SHEET_NAMES, SPREADSHEET_NAME } from '@/Config/schema'
import type { MigrationContext } from '@/Migration/MigrationContext'
import type {
  MigrationSession,
  MigrationTarget,
} from '@/Migration/MigrationTarget'
import { copyFile } from '@/Repository/GSheet/DriveFiles'
import { GDriveFolderRepository } from '@/Repository/GSheet/GDriveFolderRepository'
import { GSheetWorkbookRepository } from '@/Repository/GSheet/GSheetWorkbookRepository'
import { InMemoryWorkbookRepository } from '@/Repository/InMemoryWorkbookRepository'
import type { Clock } from '@/Service/Clock'

async function loadSpreadsheetIntoMemory(
  spreadsheetId: string,
  workbookId: string,
  reader: GSheetWorkbookRepository,
  repo: InMemoryWorkbookRepository
): Promise<void> {
  await Promise.all(
    SHEET_NAMES.map(async (sheet) => {
      try {
        const matrix = await reader.readSheetMatrix(spreadsheetId, sheet)
        await repo.replaceSheetMatrix(workbookId, sheet, matrix)
      } catch {
        // A v1 shop may omit sheets the migration will create later.
      }
    })
  )
}

/**
 * Google Drive migration target. Steps mutate an in-memory snapshot; backup
 * copies the live spreadsheet; submit writes sheets back to the source id and
 * flips folder metadata — the metadata write remains the atomic commit point.
 */
export function createGSheetMigrationTarget(
  folderId: string,
  sourceSpreadsheetId: string,
  fromVersion: string,
  toVersion: string,
  _clock: Clock
): MigrationTarget {
  return {
    async writePreUpgradeBackup(): Promise<void> {
      await copyFile(
        sourceSpreadsheetId,
        `${SPREADSHEET_NAME}.v${fromVersion}.backup`,
        folderId
      )
    },

    async openSession(): Promise<MigrationSession> {
      const reader = new GSheetWorkbookRepository()
      const repo = new InMemoryWorkbookRepository()
      const workingWorkbookId = sourceSpreadsheetId
      await loadSpreadsheetIntoMemory(
        sourceSpreadsheetId,
        workingWorkbookId,
        reader,
        repo
      )
      const ctx: MigrationContext = {
        backend: 'google-drive',
        workingWorkbookId,
        repo,
        ensureSheet: (sheet) => repo.ensureSheet(workingWorkbookId, sheet),
      }

      return {
        ctx,
        async submit(_options): Promise<void> {
          const writer = new GSheetWorkbookRepository()
          await Promise.all(
            SHEET_NAMES.map(async (sheet) => {
              if (!repo.sheets.has(sheet)) return
              const matrix = await repo.readSheetMatrix(
                workingWorkbookId,
                sheet
              )
              await writer.replaceSheetMatrix(
                sourceSpreadsheetId,
                sheet,
                matrix
              )
            })
          )
          const folderRepo = new GDriveFolderRepository()
          const outcome = await folderRepo.readMetadata(folderId)
          if (outcome.kind !== 'present') {
            throw new Error(`Source shop is missing ${METADATA_FILE_NAME}`)
          }
          await folderRepo.writeMetadata(folderId, {
            ...outcome.metadata,
            version: toVersion,
            spreadsheetId: sourceSpreadsheetId,
          })
        },
      }
    },
  }
}
