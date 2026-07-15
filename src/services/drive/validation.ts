import { APP_VERSION, parseMajorVersion } from '@/config/version'
import { getFolderRepository } from './folderRepository'
import { validateStructure } from '@/services/sheets/validateStructure'

export type ValidationResult =
  | { ok: true; spreadsheetId: string; folderName: string; metadataVersion: string }
  | { ok: false; error: 'not_shop' }
  | { ok: false; error: 'version'; shopVersion: string; appVersion: string }
  | { ok: false; error: 'structure'; detail: string }

export async function validateShopFolder(
  folderId: string
): Promise<ValidationResult> {
  const folderRepository = getFolderRepository()
  const metadata = await folderRepository.readMetadata(folderId)
  if (!metadata) {
    return { ok: false, error: 'not_shop' }
  }

  const appMajor = parseMajorVersion(APP_VERSION)
  const metaMajor = parseMajorVersion(metadata.version)
  if (appMajor !== metaMajor) {
    return { ok: false, error: 'version', shopVersion: metadata.version, appVersion: APP_VERSION }
  }

  const validationErrors = await validateStructure(
    metadata.spreadsheetId
  )
  if (validationErrors.length > 0) {
    const first = validationErrors[0]
    const detail = first.sheet ? `${first.sheet}: ${first.message}` : first.message
    return { ok: false, error: 'structure', detail }
  }

  const folderName = await folderRepository.getFolderName(folderId)

  return {
    ok: true,
    spreadsheetId: metadata.spreadsheetId,
    folderName,
    metadataVersion: metadata.version,
  }
}
