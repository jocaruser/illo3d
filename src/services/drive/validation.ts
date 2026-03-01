import { APP_VERSION } from '@/config/version'
import { driveFetch } from './client'
import { readMetadata } from './metadata'
import { validateStructure } from '@/services/sheets/validateStructure'
import { getAccessToken } from '@/services/sheets/client'

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
  const metadata = await readMetadata(folderId)
  if (!metadata) {
    return { ok: false, error: 'not_shop' }
  }

  const appMajor = parseMajor(APP_VERSION)
  const metaMajor = parseMajor(metadata.version)
  if (appMajor !== metaMajor) {
    return { ok: false, error: 'version' }
  }

  const accessToken = await getAccessToken()
  const validationErrors = await validateStructure(
    metadata.spreadsheetId,
    accessToken
  )
  if (validationErrors.length > 0) {
    return { ok: false, error: 'permissions' }
  }

  const folderResponse = await driveFetch(
    `/files/${folderId}?fields=name`
  )
  let folderName = folderId
  if (folderResponse.ok) {
    const file = (await folderResponse.json()) as { name?: string }
    if (file.name) folderName = file.name
  }

  return {
    ok: true,
    spreadsheetId: metadata.spreadsheetId,
    folderName,
    metadataVersion: metadata.version,
  }
}
