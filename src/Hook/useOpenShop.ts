import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Shop } from '@/Entity/ShopMetadata'
import {
  getFolderRepository,
  getWorkbookRepository,
} from '@/Repository/RepositoryFactory'
import { ShopValidationService } from '@/Service/ShopValidationService'
import { WorkbookService } from '@/Service/WorkbookService'
import { useShopStore } from '@/Store/shopStore'

/** A shop whose major version trails the app's — the wizard offers a migration. */
export interface MigrationCandidate {
  folderId: string
  shopVersion: string
  appVersion: string
}

export type OpenShopResult =
  | { ok: true; shop: Shop }
  | { ok: false; kind: 'error'; message: string }
  | { ok: false; kind: 'migration'; candidate: MigrationCandidate }

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function validationService(): ShopValidationService {
  return new ShopValidationService(
    getFolderRepository(),
    getWorkbookRepository()
  )
}

/**
 * Enter a validated shop: hydrate the workbook snapshot FIRST, then publish the
 * active shop. The order matters — the app shell renders as soon as
 * `activeShop` is set, so a hydration failure must leave it null and keep the
 * user in the wizard with an error.
 */
export async function enterShop(shop: Shop): Promise<void> {
  await new WorkbookService(
    getWorkbookRepository(),
    shop.spreadsheetId
  ).hydrate()
  useShopStore.getState().setActiveShop(shop)
}

/**
 * Opens an existing shop folder: validate, then hydrate and enter. An OLDER
 * shop is not an error — it is surfaced as a migration candidate so the
 * wizard can offer the migration modal. A shop ahead of the app, or one whose
 * version cannot be read, gets a plain error instead: no wizard can help it.
 */
export function useOpenShop() {
  const { t } = useTranslation()
  const [opening, setOpening] = useState(false)

  const openShop = useCallback(
    async (folderId: string): Promise<OpenShopResult> => {
      setOpening(true)
      try {
        const validation =
          await validationService().validateShopFolder(folderId)
        if (!validation.ok) {
          if (validation.error === 'version') {
            return {
              ok: false,
              kind: 'migration',
              candidate: {
                folderId,
                shopVersion: validation.shopVersion,
                appVersion: validation.appVersion,
              },
            }
          }
          // A shop AHEAD of the app, or with an unreadable version, is not a
          // migration candidate — it is told so on the welcome screen.
          if (validation.error === 'version_ahead') {
            return {
              ok: false,
              kind: 'error',
              message: t('wizard.errorVersionAhead'),
            }
          }
          if (validation.error === 'version_unreadable') {
            return {
              ok: false,
              kind: 'error',
              message: t('wizard.errorVersionUnreadable'),
            }
          }
          if (validation.error === 'not_shop') {
            return {
              ok: false,
              kind: 'error',
              message: t('wizard.errorNotShop'),
            }
          }
          return {
            ok: false,
            kind: 'error',
            message: t('wizard.errorShopStructureWithDetail', {
              detail: validation.detail,
            }),
          }
        }
        await enterShop(validation.shop)
        return { ok: true, shop: validation.shop }
      } catch (error) {
        return { ok: false, kind: 'error', message: toErrorMessage(error) }
      } finally {
        setOpening(false)
      }
    },
    [t]
  )

  return { openShop, opening }
}
