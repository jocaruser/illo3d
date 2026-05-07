import { useEffect } from 'react'

interface FaviconUpdaterProps {
  logoUrl: string | null
}

export function FaviconUpdater({ logoUrl }: FaviconUpdaterProps) {
  useEffect(() => {
    const linkElement = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null
    
    if (!linkElement) return

    if (logoUrl) {
      linkElement.href = logoUrl
    } else {
      // Fall back to default logo
      linkElement.href = '/logo.svg'
    }

    return () => {
      // Reset to default on unmount
      if (linkElement) {
        linkElement.href = '/logo.svg'
      }
    }
  }, [logoUrl])

  return null
}
