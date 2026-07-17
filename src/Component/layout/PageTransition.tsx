import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

/**
 * Re-runs the shared `fade-in`/`slide-up` animations on every navigation by
 * remounting on pathname change. Both classes are disabled under
 * `prefers-reduced-motion` in `src/Theme/tokens.css`, so no JS check is needed.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="fade-in slide-up">
      {children}
    </div>
  )
}
