import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/Component/Card'

interface RouteErrorBoundaryProps {
  children: ReactNode
}

interface RouteErrorBoundaryState {
  hasError: boolean
}

interface RouteErrorFallbackProps {
  onRetry: () => void
}

/** Split out so the fallback can use hooks the class component cannot. */
function RouteErrorFallback({ onRetry }: RouteErrorFallbackProps) {
  const { t } = useTranslation()
  return (
    <Card className="mx-auto max-w-md p-6 text-center">
      <div role="alert">
        <h2 className="font-display text-xl font-semibold text-text">{t('errors.routeTitle')}</h2>
        <p className="mt-2 text-sm text-text-muted">{t('errors.routeDescription')}</p>
      </div>
      <button type="button" className="btn-secondary mt-4" onClick={onRetry}>
        {t('errors.retry')}
      </button>
    </Card>
  )
}

/**
 * Contains a crashing page so the app shell survives it. Routes mount one per
 * pathname, so navigating away from a broken page is enough to clear it.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true }
  }

  private readonly handleRetry = (): void => {
    this.setState({ hasError: false })
  }

  render(): ReactNode {
    if (this.state.hasError) return <RouteErrorFallback onRetry={this.handleRetry} />
    return this.props.children
  }
}
