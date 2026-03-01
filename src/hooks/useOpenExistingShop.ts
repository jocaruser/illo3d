import { useCallback } from 'react'
import { useShopStore } from '@/stores/shopStore'
import { loadPickerApi, openFolderPicker } from '@/services/drive/picker'
import { validateShopFolder } from '@/services/drive/validation'
import { getAccessToken } from '@/services/sheets/client'

let inFlightSelectFolder: Promise<{ id: string; name: string } | null> | null = null

export function useOpenExistingShop() {
  const setActiveShop = useShopStore((s) => s.setActiveShop)

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
      return openFolderPicker(accessToken, apiKey)
    })().finally(() => {
      inFlightSelectFolder = null
    })
    return inFlightSelectFolder
  }, [])

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

  return { selectFolder, validateAndSetShop }
}
