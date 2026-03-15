import { useCallback } from 'react'
import { APP_VERSION } from '@/config/version'
import { useAuthStore } from '@/stores/authStore'
import { useShopStore } from '@/stores/shopStore'
import { createFolder } from '@/services/drive/folders'
import { uploadMetadata } from '@/services/drive/metadata'
import { moveFileToFolder } from '@/services/drive/files'
import { getSheetsRepository } from '@/services/sheets/repository'

export function useCreateShop() {
  const user = useAuthStore((s) => s.user)
  const setActiveShop = useShopStore((s) => s.setActiveShop)

  const createShop = useCallback(
    async (folderName: string): Promise<void> => {
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
    [user?.email, setActiveShop]
  )

  return { createShop }
}
