import type { ShopMetadata } from '@/types/shop'
import {
  isCsvBackendEnabled,
  sanitizeFixtureFolderId,
} from '@/config/csvBackend'
import { driveFetch } from './client'

const METADATA_FILENAME = 'illo3d.metadata.json'

export interface FolderRepository {
  readMetadata(folderId: string): Promise<ShopMetadata | null>
  getFolderName(folderId: string): Promise<string>
}

export class GoogleFolderRepository implements FolderRepository {
  async readMetadata(folderId: string): Promise<ShopMetadata | null> {
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

  async getFolderName(folderId: string): Promise<string> {
    const folderResponse = await driveFetch(
      `/files/${folderId}?fields=name`
    )
    if (!folderResponse.ok) {
      return folderId
    }
    const file = (await folderResponse.json()) as { name?: string }
    return file.name ?? folderId
  }
}

export class CsvFolderRepository implements FolderRepository {
  async readMetadata(folderId: string): Promise<ShopMetadata | null> {
    const safe = sanitizeFixtureFolderId(folderId)
    if (!safe) return null
    const res = await fetch(`/fixtures/${safe}/illo3d.metadata.json`)
    if (!res.ok) {
      return null
    }
    return res.json() as Promise<ShopMetadata>
  }

  async getFolderName(folderId: string): Promise<string> {
    return folderId
  }
}

export function getFolderRepository(): FolderRepository {
  if (isCsvBackendEnabled()) {
    return new CsvFolderRepository()
  }
  return new GoogleFolderRepository()
}

export const folderRepository: FolderRepository = getFolderRepository()
