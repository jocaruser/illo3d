import { useEffect, useState } from 'react'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import { getFolderRepository } from '@/Repository/RepositoryFactory'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'

export interface UseShopMetadata {
  metadata: ShopMetadata | null
  loading: boolean
  error: string | null
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Reads `illo3d.metadata.json` for the active shop — the source of the logo,
 * the local user name, the kanban auto-hide window and the default due date.
 */
export function useShopMetadata(): UseShopMetadata {
  const folderId = useShopStore((state) => state.activeShop?.folderId ?? null)
  const backend = useBackendStore((state) => state.backend)
  const localDirectoryHandle = useBackendStore((state) => state.localDirectoryHandle)
  const [state, setState] = useState<UseShopMetadata>({
    metadata: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (folderId === null || backend === null) {
      setState({ metadata: null, loading: false, error: null })
      return
    }
    if (backend === 'local-csv' && localDirectoryHandle === null) {
      setState({ metadata: null, loading: false, error: null })
      return
    }
    let cancelled = false
    setState({ metadata: null, loading: true, error: null })
    getFolderRepository()
      .readMetadata(folderId)
      .then((metadata) => {
        if (cancelled) return
        setState({ metadata, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState({ metadata: null, loading: false, error: errorMessage(error) })
      })
    return () => {
      cancelled = true
    }
  }, [folderId, backend, localDirectoryHandle])

  return state
}
