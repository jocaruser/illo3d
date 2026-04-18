import { useLocation } from 'react-router-dom'
import { RouteErrorBoundary } from './RouteErrorBoundary'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  return (
    <RouteErrorBoundary resetKey={location.pathname}>{children}</RouteErrorBoundary>
  )
}
