import { useCallback, useState } from 'react'
import type { Shop } from '@/Entity/ShopMetadata'
import { createFolder, moveFileToFolder } from '@/Repository/GSheet/DriveFiles'
import { GDriveFolderRepository } from '@/Repository/GSheet/GDriveFolderRepository'
import { GSheetWorkbookRepository } from '@/Repository/GSheet/GSheetWorkbookRepository'
import { LocalCsvFolderRepository } from '@/Repository/LocalCsv/LocalCsvFolderRepository'
import { LocalCsvWorkbookRepository } from '@/Repository/LocalCsv/LocalCsvWorkbookRepository'
import { SystemClock, type Clock } from '@/Service/Clock'
import { ShopProvisioningService } from '@/Service/ShopProvisioningService'
import { useAuthStore } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'
import { enterShop, toErrorMessage } from '@/Hook/useOpenShop'

/** Both the Drive folder and the shop are named after the app — there is no name input. */
export const SHOP_NAME = 'illo3d'

export type CreateShopResult =
  { ok: true; shop: Shop } | { ok: false; message: string }

/**
 * Drive's `spreadsheets.create` always drops the new file in My Drive, so the
 * workbook is reparented into the shop folder as part of creating it. That
 * keeps provisioning a single `ShopProvisioningService` call on both backends
 * and preserves the create → move → write-metadata order.
 */
class FolderScopedGSheetWorkbookRepository extends GSheetWorkbookRepository {
  constructor(private readonly folderId: string) {
    super()
  }

  override async createWorkbook(): Promise<string> {
    const spreadsheetId = await super.createWorkbook()
    await moveFileToFolder(spreadsheetId, this.folderId)
    return spreadsheetId
  }
}

/** Google's synthetic local user has no email; the audit actor falls back to 'local'. */
function currentActor(): string {
  const { user } = useAuthStore.getState()
  const email = user?.email ?? ''
  return email === '' ? 'local' : email
}

async function provisioner(clock: Clock): Promise<ShopProvisioningService> {
  const { backend, localDirectoryHandle } = useBackendStore.getState()

  if (backend === 'local-csv' && localDirectoryHandle !== null) {
    return new ShopProvisioningService(
      new LocalCsvFolderRepository(localDirectoryHandle),
      new LocalCsvWorkbookRepository(localDirectoryHandle),
      clock,
      localDirectoryHandle.name,
      localDirectoryHandle.name
    )
  }

  if (backend === 'google-drive') {
    const folderId = await createFolder(SHOP_NAME)
    return new ShopProvisioningService(
      new GDriveFolderRepository(),
      new FolderScopedGSheetWorkbookRepository(folderId),
      clock,
      folderId,
      SHOP_NAME
    )
  }

  throw new Error('No backend selected')
}

/**
 * Creates a brand-new shop on the active backend and enters it. The workbook is
 * hydrated before the shop becomes active, so the app never renders against an
 * empty snapshot.
 */
export function useCreateShop(clock: Clock = new SystemClock()) {
  const [creating, setCreating] = useState(false)

  const createShop = useCallback(async (): Promise<CreateShopResult> => {
    setCreating(true)
    try {
      const shop = await (await provisioner(clock)).createShop(currentActor())
      await enterShop(shop)
      return { ok: true, shop }
    } catch (error) {
      return { ok: false, message: toErrorMessage(error) }
    } finally {
      setCreating(false)
    }
  }, [clock])

  return { createShop, creating }
}
