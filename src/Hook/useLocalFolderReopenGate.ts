import { useCallback, useEffect, useState } from 'react'
import {
  queryDirectoryPermission,
  requestDirectoryPermission,
} from '@/Repository/LocalCsv/directoryPermission'
import { persistDirectoryHandle } from '@/Repository/LocalCsv/persistDirectoryHandle'
import { useAuthStore } from '@/Store/authStore'
import { useBackendStore } from '@/Store/backendStore'
import { useMigrationStore } from '@/Store/migrationStore'
import { useShopStore } from '@/Store/shopStore'
import { useWorkbookStore } from '@/Store/workbookStore'

export type LocalFolderReopenPhase =
  | 'idle'
  | 'checking'
  | 'needs-reallow'
  | 'ready'

const PERMISSION_MODE = 'readwrite' as const

export interface LocalFolderReopenGate {
  phase: LocalFolderReopenPhase
  grantAccess(): Promise<void>
  decline(): Promise<void>
}

/**
 * On local CSV reload, folder permission may have lapsed while `activeShop`
 * persists. This gate blocks workbook hydration until access is granted again
 * or the user returns to the welcome screen.
 */
export function useLocalFolderReopenGate(): LocalFolderReopenGate {
  const activeShop = useShopStore((state) => state.activeShop)
  const backend = useBackendStore((state) => state.backend)
  const localDirectoryHandle = useBackendStore(
    (state) => state.localDirectoryHandle
  )
  const [phase, setPhase] = useState<LocalFolderReopenPhase>('idle')

  const applies =
    backend === 'local-csv' && activeShop !== null && backend !== null

  useEffect(() => {
    if (!applies) {
      setPhase('idle')
      return
    }
    if (localDirectoryHandle === null) {
      setPhase('checking')
      return
    }

    let cancelled = false
    setPhase('checking')
    void queryDirectoryPermission(localDirectoryHandle, PERMISSION_MODE).then(
      (permission) => {
        if (cancelled) return
        setPhase(permission === 'granted' ? 'ready' : 'needs-reallow')
      }
    )
    return () => {
      cancelled = true
    }
  }, [applies, localDirectoryHandle])

  const grantAccess = useCallback(async () => {
    if (localDirectoryHandle === null) return
    const permission = await requestDirectoryPermission(
      localDirectoryHandle,
      PERMISSION_MODE
    )
    if (permission === 'granted') setPhase('ready')
    else setPhase('needs-reallow')
  }, [localDirectoryHandle])

  const decline = useCallback(async () => {
    useAuthStore.getState().logout()
    useShopStore.getState().clearActiveShop()
    useBackendStore.getState().clearBackend()
    useWorkbookStore.getState().reset()
    useMigrationStore.getState().reset()
    await persistDirectoryHandle(null)
    setPhase('idle')
  }, [])

  return { phase, grantAccess, decline }
}

/** True when local CSV reopen hydration may run. */
export function localFolderReopenHydrationReady(
  backend: ReturnType<typeof useBackendStore.getState>['backend'],
  activeShop: ReturnType<typeof useShopStore.getState>['activeShop'],
  phase: LocalFolderReopenPhase
): boolean {
  if (activeShop === null) return false
  if (backend !== 'local-csv') return true
  return phase === 'ready' || phase === 'idle'
}
