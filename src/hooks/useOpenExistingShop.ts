import { useCallback } from 'react'
import { useShopStore } from '@/stores/shopStore'
import { loadPickerApi, openFolderPicker } from '@/services/drive/picker'
import { validateShopFolder } from '@/services/drive/validation'
import { getAccessToken } from '@/services/sheets/client'
import {
  showDirectoryPicker,
  isDirectoryPickerSupported,
} from '@/services/local/directoryPicker'
import { useBackendStore } from '@/stores/backendStore'

let inFlightSelectFolder: Promise<{ id: string; name: string } | null> | null = null

export function useOpenExistingShop() {
  const setActiveShop = useShopStore((s) => s.setActiveShop)
  const setBackend = useBackendStore((s) => s.setBackend)
  const setLocalDirectoryHandle = useBackendStore((s) => s.setLocalDirectoryHandle)

  const selectFolder = useCallback(async (): Promise<{
    id: string
    name: string
  } | null> => {
    if (inFlightSelectFolder) {
      return inFlightSelectFolder
    }
    inFlightSelectFolder = (async () => {
      await loadPickerApi()
      const accessToken = await getAccessToken()
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
      if (!apiKey) {
        throw new Error('VITE_GOOGLE_API_KEY is not configured')
      }
      const appId = import.meta.env.VITE_GOOGLE_APP_ID
      return openFolderPicker(accessToken, apiKey, {
        appId: typeof appId === 'string' && appId.trim() ? appId.trim() : undefined,
      })
    })().finally(() => {
      inFlightSelectFolder = null
    })
    return inFlightSelectFolder
  }, [])

  const selectLocalFolder = useCallback(async (): Promise<{
    id: string
    name: string
  } | null> => {
    if (!isDirectoryPickerSupported()) {
      throw new Error('File System Access API is not supported. Please use Chrome.')
    }
    const handle = await showDirectoryPicker()
    if (!handle) return null
    setBackend('local-csv')
    setLocalDirectoryHandle(handle)
    return { id: handle.name, name: handle.name }
  }, [setBackend, setLocalDirectoryHandle])

  const validateAndSetShop = useCallback(
    async (
      folderId: string
    ): Promise<
      | { ok: true; spreadsheetId: string; folderName: string; metadataVersion: string }
      | { ok: false; error: string }
    > => {
      const result = await validateShopFolder(folderId)
      if (result.ok) {
        setActiveShop({
          folderId,
          folderName: result.folderName,
          spreadsheetId: result.spreadsheetId,
          metadataVersion: result.metadataVersion,
        })
      }
      return result
    },
    [setActiveShop]
  )

  return { selectFolder, selectLocalFolder, validateAndSetShop }
}
