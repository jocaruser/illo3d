import { Component, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

/**
 * Last-resort boundary above every provider (mounted in `main.tsx`). Anything
 * below it — i18n, the router, the theme — may be exactly what crashed, so the
 * fallback depends on nothing: static bilingual copy instead of translations,
 * and a full reload instead of a retry, because the shell's state is unknown.
 * Crashes inside a page are contained by `RouteErrorBoundary` before they ever
 * reach this one.
 */
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  private readonly handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError)
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div role="alert" className="max-w-md text-center">
            <h1 className="text-xl font-semibold">
              Something went wrong · Algo ha fallado
            </h1>
            <p className="mt-2 text-sm">
              An unexpected error broke the app. Reload to continue.
            </p>
            <p className="mt-1 text-sm">
              Un error inesperado ha roto la aplicación. Recarga para continuar.
            </p>
            <button
              type="button"
              className="btn-secondary mt-4"
              onClick={this.handleReload}
            >
              Reload · Recargar
            </button>
          </div>
        </div>
      )
    return this.props.children
  }
}
