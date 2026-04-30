import { useCallback } from 'react'
import type { ShopMetadata } from '@/types/shop'
import {
  showDirectoryPicker,
  isDirectoryPickerSupported,
  FILE_SYSTEM_ACCESS_NOT_SUPPORTED,
} from '@/services/local/directoryPicker'
import { readMetadataFromDirectoryHandle } from '@/services/local/readLocalMetadata'

export type LocalFolderPickResult = {
  handle: FileSystemDirectoryHandle
  metadata: ShopMetadata | null
}

export function useLocalFolderDetection() {
  const pickFolder = useCallback(async (): Promise<LocalFolderPickResult | null> => {
    if (!isDirectoryPickerSupported()) {
      throw new Error(FILE_SYSTEM_ACCESS_NOT_SUPPORTED)
    }
    const handle = await showDirectoryPicker()
    if (!handle) return null
    const metadata = await readMetadataFromDirectoryHandle(handle)
    return { handle, metadata }
  }, [])

  return { pickFolder }
}
