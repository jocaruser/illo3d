import { useCallback, useState } from 'react'
import { persistDirectoryHandle } from '@/Repository/LocalCsv/persistDirectoryHandle'
import { useAuthStore } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { useWorkbookStore } from '@/Store/workbookStore'

export interface UseSignOut {
  requestSignOut(): void
  confirmSignOut(): Promise<void>
  cancelSignOut(): void
  needsConfirm: boolean
}

async function completeSignOut(
  logout: () => void,
  clearActiveShop: () => void,
  clearBackend: () => void,
  resetWorkbook: () => void
): Promise<void> {
  await persistDirectoryHandle(null).catch(() => {})
  logout()
  clearActiveShop()
  clearBackend()
  resetWorkbook()
}

/**
 * Signs the user out after optional dirty-workbook confirmation.
 * Clears persisted local folder handles before tearing down session state.
 */
export function useSignOut(): UseSignOut {
  const logout = useAuthStore((state) => state.logout)
  const activeShop = useShopStore((state) => state.activeShop)
  const clearActiveShop = useShopStore((state) => state.clearActiveShop)
  const clearBackend = useBackendStore((state) => state.clearBackend)
  const resetWorkbook = useWorkbookStore((state) => state.reset)
  const dirty = useWorkbookStore((state) => state.dirty)
  const [needsConfirm, setNeedsConfirm] = useState(false)

  const runSignOut = useCallback(async () => {
    setNeedsConfirm(false)
    await completeSignOut(
      logout,
      clearActiveShop,
      clearBackend,
      resetWorkbook
    )
  }, [logout, clearActiveShop, clearBackend, resetWorkbook])

  const requestSignOut = useCallback(() => {
    if (activeShop !== null && dirty) {
      setNeedsConfirm(true)
      return
    }
    void runSignOut()
  }, [activeShop, dirty, runSignOut])

  const cancelSignOut = useCallback(() => {
    setNeedsConfirm(false)
  }, [])

  return {
    requestSignOut,
    confirmSignOut: runSignOut,
    cancelSignOut,
    needsConfirm,
  }
}
