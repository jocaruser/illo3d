import type { ShopMetadata } from '@/types/shop'
import type { FolderRepository } from '@/services/drive/folderRepository'
import { useBackendStore } from '@/stores/backendStore'

const METADATA_FILENAME = 'illo3d.metadata.json'

export class LocalFolderRepository implements FolderRepository {
  async readMetadata(folderId: string): Promise<ShopMetadata | null> {
    void folderId
    const handle = useBackendStore.getState().localDirectoryHandle
    if (!handle) return null
    try {
      const fileHandle = await handle.getFileHandle(METADATA_FILENAME)
      const file = await fileHandle.getFile()
      const text = await file.text()
      return JSON.parse(text) as ShopMetadata
    } catch {
      return null
    }
  }

  async getFolderName(folderId: string): Promise<string> {
    void folderId
    const handle = useBackendStore.getState().localDirectoryHandle
    return handle?.name ?? ''
  }
}
