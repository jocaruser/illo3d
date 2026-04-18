import { useCallback } from 'react'
import { APP_VERSION } from '@/config/version'
import { useAuthStore } from '@/stores/authStore'
import { useShopStore } from '@/stores/shopStore'
import { useBackendStore } from '@/stores/backendStore'
import { createFolder } from '@/services/drive/folders'
import { uploadMetadata } from '@/services/drive/metadata'
import { moveFileToFolder } from '@/services/drive/files'
import { getSheetsRepository } from '@/services/sheets/repository'
import {
  showDirectoryPicker,
  isDirectoryPickerSupported,
} from '@/services/local/directoryPicker'

export function useCreateShop() {
  const user = useAuthStore((s) => s.user)
  const setActiveShop = useShopStore((s) => s.setActiveShop)
  const setBackend = useBackendStore((s) => s.setBackend)
  const setLocalDirectoryHandle = useBackendStore((s) => s.setLocalDirectoryHandle)

  const createShopInLocalFolder = useCallback(
    async (handle: FileSystemDirectoryHandle): Promise<void> => {
      setBackend('local-csv')
      setLocalDirectoryHandle(handle)
      const spreadsheetId = await getSheetsRepository().createSpreadsheet()
      const folderNameFromHandle = handle.name
      setActiveShop({
        folderId: folderNameFromHandle,
        folderName: folderNameFromHandle,
        spreadsheetId,
        metadataVersion: APP_VERSION,
      })
    },
    [setActiveShop, setBackend, setLocalDirectoryHandle]
  )

  const createShop = useCallback(
    async (folderName: string): Promise<void> => {
      const backend = useBackendStore.getState().backend
      if (backend === 'local-csv') {
        if (!isDirectoryPickerSupported()) {
          throw new Error('File System Access API is not supported. Please use Chrome.')
        }
        const handle = await showDirectoryPicker()
        if (!handle) return
        await createShopInLocalFolder(handle)
        return
      }
      const { id: folderId, name } = await createFolder(folderName)
      const spreadsheetId = await getSheetsRepository().createSpreadsheet()
      await moveFileToFolder(spreadsheetId, folderId)
      await uploadMetadata(folderId, {
        app: 'illo3d',
        version: APP_VERSION,
        spreadsheetId,
        createdAt: new Date().toISOString(),
        createdBy: user?.email ?? '',
      })
      setActiveShop({
        folderId,
        folderName: name,
        spreadsheetId,
        metadataVersion: APP_VERSION,
      })
    },
    [user?.email, setActiveShop, createShopInLocalFolder]
  )

  return { createShop, createShopInLocalFolder }
}
