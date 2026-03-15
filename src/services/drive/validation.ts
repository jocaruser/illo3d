import { APP_VERSION } from '@/config/version'
import { getFolderRepository } from './folderRepository'
import { validateStructure } from '@/services/sheets/validateStructure'

export type ValidationResult =
  | { ok: true; spreadsheetId: string; folderName: string; metadataVersion: string }
  | { ok: false; error: string }

function parseMajor(version: string): number {
  const match = version.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

export async function validateShopFolder(
  folderId: string
): Promise<ValidationResult> {
  const folderRepository = getFolderRepository()
  const metadata = await folderRepository.readMetadata(folderId)
  if (!metadata) {
    return { ok: false, error: 'not_shop' }
  }

  const appMajor = parseMajor(APP_VERSION)
  const metaMajor = parseMajor(metadata.version)
  if (appMajor !== metaMajor) {
    return { ok: false, error: 'version' }
  }

  const validationErrors = await validateStructure(
    metadata.spreadsheetId
  )
  if (validationErrors.length > 0) {
    return { ok: false, error: 'permissions' }
  }

  const folderName = await folderRepository.getFolderName(folderId)

  return {
    ok: true,
    spreadsheetId: metadata.spreadsheetId,
    folderName,
    metadataVersion: metadata.version,
  }
}
