import { useState, useEffect } from 'react'

export function useShopLogoUrl(
  logoPath: string | undefined,
  handle: FileSystemDirectoryHandle | null
): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!logoPath || !handle) {
      setUrl(null)
      return
    }

    const resolvedHandle = handle
    const resolvedLogoPath = logoPath
    let objectUrl: string | null = null
    let cancelled = false

    async function load() {
      try {
        const fileHandle = await resolvedHandle.getFileHandle(resolvedLogoPath)
        const file = await fileHandle.getFile()
        if (!cancelled) {
          objectUrl = URL.createObjectURL(file)
          setUrl(objectUrl)
        }
      } catch {
        if (!cancelled) {
          setUrl(null)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [logoPath, handle])

  return url
}
