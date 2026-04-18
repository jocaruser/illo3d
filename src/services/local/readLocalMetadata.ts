import type { ShopMetadata } from '@/types/shop'

const METADATA_FILENAME = 'illo3d.metadata.json'

export async function readMetadataFromDirectoryHandle(
  handle: FileSystemDirectoryHandle
): Promise<ShopMetadata | null> {
  try {
    const fileHandle = await handle.getFileHandle(METADATA_FILENAME)
    const file = await fileHandle.getFile()
    const text = await file.text()
    return JSON.parse(text) as ShopMetadata
  } catch {
    return null
  }
}
