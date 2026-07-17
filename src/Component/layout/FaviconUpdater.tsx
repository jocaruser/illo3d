import { useEffect } from 'react'
import { useShopLogoUrl } from '@/Hook/useShopLogoUrl'

/**
 * Points the tab icon at the active shop's logo so several shops open in
 * several tabs stay tellable apart. Falls back to the bundled mark; the href
 * is base-path aware because production serves the app from `/illo3d/`.
 */
export function FaviconUpdater() {
  const logoUrl = useShopLogoUrl()

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (link === null) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    if (logoUrl === null) {
      link.setAttribute('type', 'image/svg+xml')
      link.setAttribute('href', `${import.meta.env.BASE_URL}logo.svg`)
      return
    }
    // The shop logo's format is unknown — a stale `type` would misdeclare it.
    link.removeAttribute('type')
    link.setAttribute('href', logoUrl)
  }, [logoUrl])

  return null
}
