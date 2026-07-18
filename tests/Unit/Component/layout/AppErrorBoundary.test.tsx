import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppErrorBoundary } from '@/Component/layout/AppErrorBoundary'

function Bomb(): never {
  throw new Error('shell exploded')
}

describe('AppErrorBoundary', () => {
  it('renders its children while nothing crashes', () => {
    render(
      <AppErrorBoundary>
        <p>app content</p>
      </AppErrorBoundary>
    )

    expect(screen.getByText('app content')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the bilingual fallback when a child crashes', () => {
    // The boundary is above i18n on purpose, so both languages are static.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/something went wrong/i)
    expect(alert).toHaveTextContent(/algo ha fallado/i)
    expect(alert).toHaveTextContent(/reload to continue/i)
    expect(alert).toHaveTextContent(/recarga para continuar/i)
  })

  it('reloads the app from the fallback button', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })

    render(
      <AppErrorBoundary>
        <Bomb />
      </AppErrorBoundary>
    )

    await userEvent.setup().click(
      screen.getByRole('button', { name: /reload · recargar/i })
    )

    expect(reload).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })
})
