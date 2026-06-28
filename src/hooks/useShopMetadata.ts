import { useState, useEffect } from 'react'
import { useShopStore } from '@/stores/shopStore'
import { useBackendStore } from '@/stores/backendStore'
import { getFolderRepository } from '@/services/drive/folderRepository'
import type { ShopMetadata } from '@/types/shop'

export function useShopMetadata(): {
  data: ShopMetadata | null
  error: string | null
  loading: boolean
} {
  const folderId = useShopStore((s) => s.activeShop?.folderId ?? null)
  const backend = useBackendStore((s) => s.backend)
  const localDirectoryHandle = useBackendStore((s) => s.localDirectoryHandle)
  const [data, setData] = useState<ShopMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!folderId) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    if (backend === 'local-csv' && !localDirectoryHandle) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    getFolderRepository()
      .readMetadata(folderId)
      .then((metadata) => {
        setData(metadata)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
  }, [folderId, backend, localDirectoryHandle])

  return { data, error, loading }
}
