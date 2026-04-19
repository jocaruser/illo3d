import { APP_VERSION } from '@/config/version'
import { ensureLocalPiecesCsvCanonical } from '@/services/local/ensureLocalPiecesCsvCanonical'
import { getFolderRepository } from './folderRepository'
import { ensurePiecesSheetCanonicalRemote } from '@/services/sheets/ensurePiecesSheetCanonicalRemote'
import { validateStructure } from '@/services/sheets/validateStructure'

export type ValidationResult =
  | { ok: true; spreadsheetId: string; folderName: string; metadataVersion: string }
  | { ok: false; error: string; /** First `validateStructure` issue when `error` is `structure`. */ detail?: string }

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

  await ensureLocalPiecesCsvCanonical(metadata.spreadsheetId)
  await ensurePiecesSheetCanonicalRemote(metadata.spreadsheetId)

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
