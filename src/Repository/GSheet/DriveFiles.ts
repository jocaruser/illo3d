import { driveFetch } from './GoogleApiClient'

/**
 * Drive v3 file helpers shared by the folder repository, shop provisioning
 * and the migration engine (working copies, backups, atomic renames).
 */

interface DriveFile {
  id?: string
  name?: string
  parents?: string[]
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

/** Create a Drive folder and return its id. */
export async function createFolder(name: string): Promise<string> {
  const response = await driveFetch('/files', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  })
  const payload = (await response.json()) as DriveFile
  return payload.id ?? ''
}

/** Copy a file (optionally into a folder) and return the copy's id. */
export async function copyFile(
  fileId: string,
  newName: string,
  parentFolderId?: string
): Promise<string> {
  const response = await driveFetch(`/files/${fileId}/copy`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      name: newName,
      ...(parentFolderId ? { parents: [parentFolderId] } : {}),
    }),
  })
  const payload = (await response.json()) as DriveFile
  return payload.id ?? ''
}

export async function renameFile(
  fileId: string,
  newName: string
): Promise<void> {
  await driveFetch(`/files/${fileId}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ name: newName }),
  })
}

export async function deleteFile(fileId: string): Promise<void> {
  await driveFetch(`/files/${fileId}`, { method: 'DELETE' })
}

/** Reparent a file into `folderId`, removing its current parents. */
export async function moveFileToFolder(
  fileId: string,
  folderId: string
): Promise<void> {
  const response = await driveFetch(`/files/${fileId}?fields=parents`)
  const payload = (await response.json()) as DriveFile
  const removeParents = (payload.parents ?? []).join(',')
  await driveFetch(
    `/files/${fileId}?addParents=${folderId}&removeParents=${removeParents}`,
    {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify({}),
    }
  )
}
