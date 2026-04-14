import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react'
import { RouteErrorBoundaryFallback } from './RouteErrorBoundaryFallback'

type BoundaryProps = {
  resetKey: string
  children: ReactNode
}

type BoundaryState = {
  error: Error | null
  /** Incremented on retry so children remount and local state resets. */
  resetNonce: number
}

export class RouteErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, resetNonce: 0 }

  static getDerivedStateFromError(error: Error): Pick<BoundaryState, 'error'> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RouteErrorBoundary:', error, info.componentStack)
  }

  componentDidUpdate(prevProps: BoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState((s) => ({ error: null, resetNonce: s.resetNonce + 1 }))
    }
  }

  handleRetry = () => {
    this.setState((s) => ({
      error: null,
      resetNonce: s.resetNonce + 1,
    }))
  }

  render() {
    if (this.state.error) {
      return <RouteErrorBoundaryFallback onRetry={this.handleRetry} />
    }
    return <Fragment key={this.state.resetNonce}>{this.props.children}</Fragment>
  }
}
