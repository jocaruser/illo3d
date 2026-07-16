import { METADATA_FILE_NAME } from '@/Config/schema'
import { isShopMetadata, type ShopMetadata } from '@/Entity/ShopMetadata'
import type { FolderRepositoryInterface } from '@/Repository/FolderRepositoryInterface'
import { driveFetch, uploadMultipart } from './GoogleApiClient'

export {
  copyFile,
  createFolder,
  deleteFile,
  moveFileToFolder,
  renameFile,
} from './DriveFiles'

interface FileListResponse {
  files?: { id?: string }[]
}

/**
 * Folder backend over Google Drive v3. `folderId` is the Drive folder id;
 * `illo3d.metadata.json` lives as a file inside it.
 */
export class GDriveFolderRepository implements FolderRepositoryInterface {
  async readMetadata(folderId: string): Promise<ShopMetadata | null> {
    const fileId = await this.findMetadataFileId(folderId)
    if (fileId === null) return null
    const response = await driveFetch(`/files/${fileId}?alt=media`)
    let parsed: unknown
    try {
      parsed = JSON.parse(await response.text())
    } catch {
      return null
    }
    return isShopMetadata(parsed) ? parsed : null
  }

  async writeMetadata(folderId: string, metadata: ShopMetadata): Promise<void> {
    const content = JSON.stringify(metadata, null, 2)
    const fileId = await this.findMetadataFileId(folderId)
    if (fileId !== null) {
      await uploadMultipart({}, content, { fileId })
      return
    }
    await uploadMultipart(
      {
        name: METADATA_FILE_NAME,
        parents: [folderId],
        mimeType: 'application/json',
      },
      content
    )
  }

  async getFolderName(folderId: string): Promise<string> {
    const response = await driveFetch(`/files/${folderId}?fields=name`)
    const payload = (await response.json()) as { name?: string }
    return payload.name ?? ''
  }

  private async findMetadataFileId(folderId: string): Promise<string | null> {
    const query = `name='${METADATA_FILE_NAME}' and '${folderId}' in parents and trashed=false`
    const response = await driveFetch(
      `/files?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1`
    )
    const payload = (await response.json()) as FileListResponse
    return payload.files?.[0]?.id ?? null
  }
}
