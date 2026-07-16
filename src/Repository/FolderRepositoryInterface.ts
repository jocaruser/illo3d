import type { ShopMetadata } from '@/Entity/ShopMetadata'

/**
 * Storage backend contract for a shop *folder* — the container that holds the
 * workbook plus `illo3d.metadata.json`. Implementations:
 *   - `LocalCsvFolderRepository` (File System Access API directory handle)
 *   - `GDriveFolderRepository` (Google Drive v3)
 */
export interface FolderRepositoryInterface {
  /** Read and parse `illo3d.metadata.json`; null when the file is absent. */
  readMetadata(folderId: string): Promise<ShopMetadata | null>

  /** Create or overwrite `illo3d.metadata.json`. */
  writeMetadata(folderId: string, metadata: ShopMetadata): Promise<void>

  /** Human-readable folder name for display. */
  getFolderName(folderId: string): Promise<string>
}
