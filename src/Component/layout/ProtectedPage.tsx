import { Suspense, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { LoadingSpinner } from '@/Component/LoadingSpinner'
import { PageTransition } from '@/Component/layout/PageTransition'
import { RouteErrorBoundary } from '@/Component/layout/RouteErrorBoundary'
import { useShopStore } from '@/Store/shopStore'

interface ProtectedPageProps {
  children: ReactNode
}

/**
 * Gates a route on an open shop. Without one the page renders nothing and the
 * setup wizard (a modal overlay from `AppLayout`) is what the user sees — the
 * URL is preserved, so finishing the wizard lands on the page they asked for.
 * The error boundary is keyed by pathname so a crash never outlives its route.
 */
export function ProtectedPage({ children }: ProtectedPageProps) {
  const activeShop = useShopStore((state) => state.activeShop)
  const { pathname } = useLocation()

  if (activeShop === null) return null

  return (
    <RouteErrorBoundary key={pathname}>
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        }
      >
        <PageTransition>{children}</PageTransition>
      </Suspense>
    </RouteErrorBoundary>
  )
}
