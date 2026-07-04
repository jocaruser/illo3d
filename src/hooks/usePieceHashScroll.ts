import { useEffect } from 'react'

export function usePieceHashScroll(
  enabled: boolean,
  onScrollToPiece: (pieceId: string) => void
) {
  useEffect(() => {
    if (!enabled) return

    let timeoutId: number | null = null

    const handleHashChange = () => {
      const anchor = window.location.hash.replace(/^#/, '')
      if (!anchor.startsWith('piece-')) return
      const pieceId = anchor.replace('piece-', '')
      onScrollToPiece(pieceId)
      timeoutId = window.setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }, 0)
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [enabled, onScrollToPiece])
}
