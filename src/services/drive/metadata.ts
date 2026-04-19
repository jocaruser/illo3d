import type { ShopMetadata } from '@/types/shop'
import { googleFetchWithAuthRetry } from '@/services/google/authorizedFetch'
import { driveFetch } from './client'

const METADATA_FILENAME = 'illo3d.metadata.json'

export async function uploadMetadata(
  folderId: string,
  metadata: ShopMetadata
): Promise<void> {
  const boundary = '-------314159265358979323846'
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`

  const metadataPart = JSON.stringify({
    name: METADATA_FILENAME,
    parents: [folderId],
  })
  const mediaPart = JSON.stringify(metadata)

  const body =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    metadataPart +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    mediaPart +
    closeDelimiter

  const response = await googleFetchWithAuthRetry(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      (error as { error?: { message?: string } }).error?.message ||
        `Failed to upload metadata: ${response.status}`
    )
  }
}

export async function readMetadata(
  folderId: string
): Promise<ShopMetadata | null> {
  const listResponse = await driveFetch(
    `/files?q='${folderId}' in parents and name='${METADATA_FILENAME}' and trashed=false`
  )

  if (!listResponse.ok) {
    throw new Error(`Failed to list folder: ${listResponse.status}`)
  }

  const listResult = (await listResponse.json()) as {
    files?: { id: string }[]
  }
  const files = listResult.files || []
  if (files.length === 0) {
    return null
  }

  const fileId = files[0].id
  const contentResponse = await driveFetch(`/files/${fileId}?alt=media`)

  if (!contentResponse.ok) {
    throw new Error(`Failed to read metadata: ${contentResponse.status}`)
  }

  const content = await contentResponse.json()
  return content as ShopMetadata
}
