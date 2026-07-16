import { METADATA_FILE_NAME, SPREADSHEET_NAME } from '@/Config/schema'
import type { MigrationContext } from '@/Migration/MigrationContext'
import type { MigrationTarget, WorkingCopy } from '@/Migration/MigrationTarget'
import {
  copyFile,
  deleteFile,
  renameFile,
} from '@/Repository/GSheet/DriveFiles'
import { GDriveFolderRepository } from '@/Repository/GSheet/GDriveFolderRepository'
import { GSheetWorkbookRepository } from '@/Repository/GSheet/GSheetWorkbookRepository'
import type { Clock } from '@/Service/Clock'

/**
 * Google Drive migration target. The working copy is a Drive copy of the
 * source spreadsheet (`illo3d-data.v<from>.v<to>.migration`) in the same shop
 * folder. Commit rewrites `illo3d.metadata.json` to point at the migrated
 * spreadsheet with the flipped version — that single metadata write is the
 * atomic commit point; the renames after it are cosmetic.
 */
export function createGSheetMigrationTarget(
  folderId: string,
  sourceSpreadsheetId: string,
  fromVersion: string,
  toVersion: string,
  _clock: Clock
): MigrationTarget {
  return {
    async createWorkingCopy(): Promise<WorkingCopy> {
      const workingId = await copyFile(
        sourceSpreadsheetId,
        `${SPREADSHEET_NAME}.v${fromVersion}.v${toVersion}.migration`,
        folderId
      )
      const repo = new GSheetWorkbookRepository()
      const ctx: MigrationContext = {
        backend: 'google-drive',
        workingWorkbookId: workingId,
        repo,
        ensureSheet: (sheet) => repo.ensureSheet(workingId, sheet),
      }

      return {
        ctx,
        async commit({ keepOriginalAsBackup }): Promise<void> {
          const folderRepo = new GDriveFolderRepository()
          const metadata = await folderRepo.readMetadata(folderId)
          if (metadata === null) {
            throw new Error(`Source shop is missing ${METADATA_FILE_NAME}`)
          }
          // The atomic commit point: metadata now points at the migrated copy.
          await folderRepo.writeMetadata(folderId, {
            ...metadata,
            version: toVersion,
            spreadsheetId: workingId,
          })
          await renameFile(workingId, SPREADSHEET_NAME)
          if (keepOriginalAsBackup) {
            await renameFile(
              sourceSpreadsheetId,
              `${SPREADSHEET_NAME}.v${fromVersion}.backup`
            )
          } else {
            await deleteFile(sourceSpreadsheetId)
          }
        },
      }
    },
  }
}
