import { useEffect } from 'react'
import { useWorkbookService } from '@/Hook/useWorkbookService'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { useWorkbookStore } from '@/Store/workbookStore'

/** GIS script poll cadence / cap while waiting for `window.google`. */
const GIS_POLL_MS = 50
const GIS_WAIT_MAX_MS = 5000

/**
 * Reopens the workbook after a reload. The active shop persists in
 * `localStorage` (ARCHITECTURE.md, "Client-side persistence") but the snapshot
 * lives in memory, so a page load with a persisted shop starts at `idle` and
 * nothing else hydrates — the wizard only hydrates on its own open/create
 * paths. Hydration is keyed on the service identity: for Local CSV it only
 * materializes once the IndexedDB directory handle is restored, and `hydrate`
 * is a no-op until then. An `error` status is deliberately left alone —
 * retrying is the user's call (toast action / Refresh), not a render loop's.
 *
 * The Drive backend authenticates through the GIS token client, whose script
 * (`accounts.google.com/gsi/client`) loads asynchronously after mount, so
 * hydrating immediately would fail token renewal spuriously. Wait briefly for
 * `window.google`; on timeout hydrate anyway so the real error surfaces.
 */
export function WorkbookBootstrap() {
  const activeShop = useShopStore((state) => state.activeShop)
  const status = useWorkbookStore((state) => state.status)
  const backend = useBackendStore((state) => state.backend)
  const { hydrate } = useWorkbookService()

  useEffect(() => {
    if (activeShop === null || status !== 'idle') return
    if (backend === 'google-drive' && window.google === undefined) {
      const startedAt = Date.now()
      const timer = setInterval(() => {
        const stillLoading =
          window.google === undefined &&
          Date.now() - startedAt < GIS_WAIT_MAX_MS
        if (stillLoading) return
        clearInterval(timer)
        void hydrate()
      }, GIS_POLL_MS)
      return () => clearInterval(timer)
    }
    void hydrate()
  }, [activeShop, status, backend, hydrate])

  return null
}
