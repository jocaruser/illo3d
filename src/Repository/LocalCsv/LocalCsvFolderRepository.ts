import { METADATA_FILE_NAME } from '@/Config/schema'
import { isShopMetadata, type ShopMetadata } from '@/Entity/ShopMetadata'
import type { FolderRepositoryInterface } from '@/Repository/FolderRepositoryInterface'

/**
 * Folder backend over a local directory handle. `folderId` parameters are
 * accepted only to satisfy the interface — the handle is authoritative.
 */
export class LocalCsvFolderRepository implements FolderRepositoryInterface {
  constructor(private readonly directory: FileSystemDirectoryHandle) {}

  async readMetadata(_folderId: string): Promise<ShopMetadata | null> {
    let text: string
    try {
      const fileHandle = await this.directory.getFileHandle(METADATA_FILE_NAME)
      const file = await fileHandle.getFile()
      text = await file.text()
    } catch {
      return null
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return null
    }
    return isShopMetadata(parsed) ? parsed : null
  }

  async writeMetadata(
    _folderId: string,
    metadata: ShopMetadata
  ): Promise<void> {
    const fileHandle = await this.directory.getFileHandle(METADATA_FILE_NAME, {
      create: true,
    })
    const writable = await fileHandle.createWritable()
    await writable.write(JSON.stringify(metadata, null, 2))
    await writable.close()
  }

  async getFolderName(_folderId: string): Promise<string> {
    return this.directory.name
  }
}
