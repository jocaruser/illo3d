import type { ShopMetadata } from '@/types/shop'
import type { FolderRepository } from '@/services/drive/folderRepository'
import { sanitizeFixtureFolderId } from './csvFixtureUtils'

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
