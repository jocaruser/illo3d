import { useEffect, useState } from 'react'
import { driveFetch } from '@/Repository/GSheet/GoogleApiClient'
import { useBackendStore } from '@/Store/backendStore'
import { useShopStore } from '@/Store/shopStore'
import { useShopMetadata } from './useShopMetadata'

interface DriveFileListResponse {
  files?: { id?: string; thumbnailLink?: string }[]
}

/** Local backend: the logo is a file next to the CSVs; read it through the handle. */
async function readLocalLogo(
  directory: FileSystemDirectoryHandle,
  logo: string
): Promise<{ url: string; revocable: boolean }> {
  const fileHandle = await directory.getFileHandle(logo)
  const file = await fileHandle.getFile()
  return { url: URL.createObjectURL(file), revocable: true }
}

/**
 * Drive backend: an `<img>` cannot send a bearer token, so use the thumbnail
 * link Drive hands out, falling back to the plain per-file view URL.
 */
async function readDriveLogo(
  folderId: string,
  logo: string
): Promise<{ url: string; revocable: boolean }> {
  const query = `name='${logo}' and '${folderId}' in parents and trashed=false`
  const response = await driveFetch(
    `/files?q=${encodeURIComponent(query)}&fields=files(id,thumbnailLink)&pageSize=1`
  )
  const payload = (await response.json()) as DriveFileListResponse
  const file = payload.files?.[0]
  if (file?.id === undefined)
    throw new Error(`Logo not found in Drive folder: ${logo}`)
  return {
    url:
      file.thumbnailLink ??
      `https://drive.google.com/uc?export=view&id=${file.id}`,
    revocable: false,
  }
}

/**
 * Resolves `metadata.logo` to something an `<img src>` can render, or null
 * when the shop has no logo (callers fall back to `/logo.svg`). Object URLs
 * minted for the local backend are revoked when they go out of use.
 */
export function useShopLogoUrl(): string | null {
  const { metadata } = useShopMetadata()
  const folderId = useShopStore((state) => state.activeShop?.folderId ?? null)
  const backend = useBackendStore((state) => state.backend)
  const localDirectoryHandle = useBackendStore(
    (state) => state.localDirectoryHandle
  )
  const logo = metadata?.logo ?? null
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (logo === null || logo === '' || folderId === null) {
      setUrl(null)
      return
    }
    let cancelled = false
    let objectUrl: string | null = null

    const resolve = async (): Promise<{
      url: string
      revocable: boolean
    } | null> => {
      if (backend === 'local-csv' && localDirectoryHandle !== null) {
        return readLocalLogo(localDirectoryHandle, logo)
      }
      if (backend === 'google-drive') return readDriveLogo(folderId, logo)
      return null
    }

    resolve()
      .then((resolved) => {
        if (resolved === null) return
        if (cancelled) {
          if (resolved.revocable) URL.revokeObjectURL(resolved.url)
          return
        }
        if (resolved.revocable) objectUrl = resolved.url
        setUrl(resolved.url)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })

    return () => {
      cancelled = true
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl)
    }
  }, [logo, folderId, backend, localDirectoryHandle])

  return url
}
