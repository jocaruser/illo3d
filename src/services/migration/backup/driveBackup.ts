import { driveFetch } from '@/services/drive/client'
import { readMetadata, updateMetadata } from '@/services/drive/metadata'
import { sheetsFetch } from '@/services/sheets/client'
import { SPREADSHEET_NAME, type SheetName } from '@/services/sheets/config'
import { GoogleSheetsRepository } from '@/services/sheets/repository'
import { emptySheetMatrix } from '@/services/sheets/sheetMatrix'
import type {
  CommitOptions,
  MigrationTarget,
  WorkingCopy,
} from '../MigrationTarget'

export interface DriveMigrationTargetParams {
  folderId: string
  spreadsheetId: string
  fromVersion: string
  toVersion: string
}

export function createDriveMigrationTarget(
  params: DriveMigrationTargetParams
): MigrationTarget {
  return {
    async createWorkingCopy(): Promise<WorkingCopy> {
      const workingId = await copySpreadsheet(params)
      const repo = new GoogleSheetsRepository()
      return {
        ctx: {
          backend: 'google-drive',
          workingSpreadsheetId: workingId,
          repo,
          ensureSheet: (sheetName) =>
            ensureSpreadsheetSheet(repo, workingId, sheetName),
        },
        commit: (options) => commitWorkingCopy(params, workingId, options),
      }
    },
  }
}

function workingCopyName(params: DriveMigrationTargetParams): string {
  return `${SPREADSHEET_NAME}.${datestamp()}.v${params.fromVersion}.v${params.toVersion}.migration`
}

function backupName(params: DriveMigrationTargetParams): string {
  return `${SPREADSHEET_NAME}.${datestamp()}.v${params.fromVersion}.backup`
}

function datestamp(): string {
  return new Date().toISOString().slice(0, 10)
}

async function copySpreadsheet(
  params: DriveMigrationTargetParams
): Promise<string> {
  const response = await driveFetch(`/files/${params.spreadsheetId}/copy`, {
    method: 'POST',
    body: JSON.stringify({
      name: workingCopyName(params),
      parents: [params.folderId],
    }),
  })
  if (!response.ok) {
    throw new Error(`Failed to copy spreadsheet: ${response.status}`)
  }
  const result = (await response.json()) as { id?: string }
  if (!result.id) {
    throw new Error('No file id in spreadsheet copy response')
  }
  return result.id
}

async function ensureSpreadsheetSheet(
  repo: GoogleSheetsRepository,
  spreadsheetId: string,
  sheetName: SheetName
): Promise<void> {
  const existing = await repo.getSheetNames(spreadsheetId)
  if (existing.includes(sheetName)) return
  const response = await sheetsFetch(`/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    }),
  })
  if (!response.ok) {
    throw new Error(`Failed to create sheet ${sheetName}: ${response.status}`)
  }
  await repo.replaceSheetMatrix(
    spreadsheetId,
    sheetName,
    emptySheetMatrix(sheetName)
  )
}

// Metadata references the spreadsheet by file id, so the single metadata update
// (new version + new spreadsheetId) is the atomic commit point; the renames
// afterwards are cosmetic.
async function commitWorkingCopy(
  params: DriveMigrationTargetParams,
  workingId: string,
  options: CommitOptions
): Promise<void> {
  const metadata = await readMetadata(params.folderId)
  if (!metadata) {
    throw new Error('Shop metadata not found')
  }
  await updateMetadata(params.folderId, {
    ...metadata,
    version: params.toVersion,
    spreadsheetId: workingId,
  })
  await renameFile(workingId, SPREADSHEET_NAME)
  if (options.keepOriginalAsBackup) {
    await renameFile(params.spreadsheetId, backupName(params))
  } else {
    await deleteFile(params.spreadsheetId)
  }
}

async function renameFile(fileId: string, name: string): Promise<void> {
  const response = await driveFetch(`/files/${fileId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
  if (!response.ok) {
    throw new Error(`Failed to rename file: ${response.status}`)
  }
}

async function deleteFile(fileId: string): Promise<void> {
  const response = await driveFetch(`/files/${fileId}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.status}`)
  }
}
