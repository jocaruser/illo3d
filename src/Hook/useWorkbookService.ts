import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/Component/Toast'
import { getWorkbookRepository } from '@/Repository/RepositoryFactory'
import { GoogleSessionError } from '@/Security/GoogleSession'
import { WorkbookService } from '@/Service/WorkbookService'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { useWorkbookStore, type WorkbookStatus } from '@/Store/workbookStore'

export interface UseWorkbookService {
  /** Read the whole workbook into the snapshot. */
  hydrate(): Promise<void>
  /**
   * Re-read the workbook. When the snapshot is dirty this only raises
   * `needsConfirm` — the caller must confirm before local edits are dropped.
   */
  refresh(): Promise<void>
  /** Proceed with a refresh the user just confirmed. */
  confirmRefresh(): Promise<void>
  cancelRefresh(): void
  /** True while a dirty refresh waits for the user's answer. */
  needsConfirm: boolean
  save(): Promise<void>
  dirty: boolean
  status: WorkbookStatus
  /** A workbook is open and idle: the only state in which Save makes sense. */
  ready: boolean
}

/**
 * Binds the workbook unit of work to the active shop and reports failures as
 * toasts. Returns no-ops while no shop is open, so callers can render the
 * chrome unconditionally.
 */
export function useWorkbookService(): UseWorkbookService {
  const { t } = useTranslation()
  const spreadsheetId = useShopStore((state) => state.activeShop?.spreadsheetId ?? null)
  const backend = useBackendStore((state) => state.backend)
  const localDirectoryHandle = useBackendStore((state) => state.localDirectoryHandle)
  const dirty = useWorkbookStore((state) => state.dirty)
  const status = useWorkbookStore((state) => state.status)
  const saveInProgress = useWorkbookStore((state) => state.saveInProgress)
  const [needsConfirm, setNeedsConfirm] = useState(false)

  const service = useMemo(() => {
    if (spreadsheetId === null || backend === null) return null
    if (backend === 'local-csv' && localDirectoryHandle === null) return null
    return new WorkbookService(getWorkbookRepository(), spreadsheetId)
  }, [spreadsheetId, backend, localDirectoryHandle])

  const hydrate: () => Promise<void> = useCallback(async () => {
    if (service === null) return
    try {
      await service.hydrate()
    } catch (error) {
      if (error instanceof GoogleSessionError) {
        toast.error(t('errors.googleSession'))
        return
      }
      toast.error(t('toast.loadError'), {
        action: {
          label: t('toast.retryAction'),
          onClick: () => {
            void hydrate()
          },
        },
      })
    }
  }, [service, t])

  const runRefresh = useCallback(async () => {
    setNeedsConfirm(false)
    await hydrate()
  }, [hydrate])

  const refresh = useCallback(async () => {
    if (dirty) {
      setNeedsConfirm(true)
      return
    }
    await runRefresh()
  }, [dirty, runRefresh])

  const cancelRefresh = useCallback(() => {
    setNeedsConfirm(false)
  }, [])

  const save: () => Promise<void> = useCallback(async () => {
    if (service === null) return
    try {
      await service.save()
      toast.success(t('workbook.saveSuccess'))
    } catch (error) {
      if (error instanceof GoogleSessionError) {
        toast.error(t('errors.googleSession'))
        return
      }
      toast.error(t('workbook.saveError'), {
        action: {
          label: t('workbook.retry'),
          onClick: () => {
            void save()
          },
        },
      })
    }
  }, [service, t])

  return {
    hydrate,
    refresh,
    confirmRefresh: runRefresh,
    cancelRefresh,
    needsConfirm,
    save,
    dirty,
    status,
    ready: service !== null && status === 'ready' && !saveInProgress,
  }
}
