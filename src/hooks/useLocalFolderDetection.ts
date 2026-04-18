import { useCallback } from 'react'
import type { ShopMetadata } from '@/types/shop'
import {
  showDirectoryPicker,
  isDirectoryPickerSupported,
} from '@/services/local/directoryPicker'
import { readMetadataFromDirectoryHandle } from '@/services/local/readLocalMetadata'

export type LocalFolderPickResult = {
  handle: FileSystemDirectoryHandle
  metadata: ShopMetadata | null
}

export function useLocalFolderDetection() {
  const pickFolder = useCallback(async (): Promise<LocalFolderPickResult | null> => {
    if (!isDirectoryPickerSupported()) {
      throw new Error('File System Access API is not supported. Please use Chrome.')
    }
    const handle = await showDirectoryPicker()
    if (!handle) return null
    const metadata = await readMetadataFromDirectoryHandle(handle)
    return { handle, metadata }
  }, [])

  return { pickFolder }
}
