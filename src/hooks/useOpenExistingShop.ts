import { useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useShopStore } from '@/stores/shopStore'
import {
  validateShopFolder,
  type ValidationResult,
} from '@/services/drive/validation'
import {
  showDirectoryPicker,
  isDirectoryPickerSupported,
  FILE_SYSTEM_ACCESS_NOT_SUPPORTED,
} from '@/services/local/directoryPicker'
import { useBackendStore } from '@/stores/backendStore'

export function useOpenExistingShop() {
  const setActiveShop = useShopStore((s) => s.setActiveShop)
  const setBackend = useBackendStore((s) => s.setBackend)
  const setLocalDirectoryHandle = useBackendStore((s) => s.setLocalDirectoryHandle)

  const selectLocalFolder = useCallback(async (): Promise<{
    id: string
    name: string
  } | null> => {
    if (!isDirectoryPickerSupported()) {
      throw new Error(FILE_SYSTEM_ACCESS_NOT_SUPPORTED)
    }
    const handle = await showDirectoryPicker()
    if (!handle) return null
    setBackend('local-csv')
    setLocalDirectoryHandle(handle)
    return { id: handle.name, name: handle.name }
  }, [setBackend, setLocalDirectoryHandle])

  const validateAndSetShop = useCallback(
    async (folderId: string): Promise<ValidationResult> => {
      const result = await validateShopFolder(folderId)
      if (result.ok) {
        if (useAuthStore.getState().credentials?.accessToken) {
          setBackend('google-drive')
        }
        setActiveShop({
          folderId,
          folderName: result.folderName,
          spreadsheetId: result.spreadsheetId,
          metadataVersion: result.metadataVersion,
        })
      }
      return result
    },
    [setActiveShop, setBackend]
  )

  return { selectLocalFolder, validateAndSetShop }
}
