import type { ShopMetadata } from '@/Entity/ShopMetadata'
import type { MetadataReadOutcome } from '@/Repository/MetadataReadOutcome'

/**
 * Storage backend contract for a shop *folder* — the container that holds the
 * workbook plus `illo3d.metadata.json`. Implementations:
 *   - `LocalCsvFolderRepository` (File System Access API directory handle)
 *   - `GDriveFolderRepository` (Google Drive v3)
 */
export interface FolderRepositoryInterface {
  /** Read and parse `illo3d.metadata.json` into absent, damaged, or present. */
  readMetadata(folderId: string): Promise<MetadataReadOutcome>

  /** Create or overwrite `illo3d.metadata.json`. */
  writeMetadata(folderId: string, metadata: ShopMetadata): Promise<void>

  /** Human-readable folder name for display. */
  getFolderName(folderId: string): Promise<string>
}
