import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouteErrorBoundary } from '@/Component/layout/RouteErrorBoundary'
import { renderLayout } from './renderLayout'

function Boom(): never {
  throw new Error('page exploded')
}

/**
 * Recovers on retry. The flag lives outside React on purpose: state set during
 * a render that then throws is discarded, so it could never stop throwing.
 */
let pageIsBroken = true

function FlakyPage() {
  if (pageIsBroken) throw new Error('transient failure')
  return <p>recovered</p>
}

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    // React logs every caught error; the boundary is the point of this suite.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children while nothing throws', () => {
    renderLayout(
      <RouteErrorBoundary>
        <p>page content</p>
      </RouteErrorBoundary>
    )

    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('shows a localized fallback when a child throws', () => {
    renderLayout(
      <RouteErrorBoundary>
        <Boom />
      </RouteErrorBoundary>
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'This page couldn’t be displayed'
    )
    expect(
      screen.getByText('Something unexpected happened. You can try again.')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Try again' })
    ).toBeInTheDocument()
  })

  it('re-renders the page when retried', async () => {
    pageIsBroken = true
    renderLayout(
      <RouteErrorBoundary>
        <FlakyPage />
      </RouteErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    pageIsBroken = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByText('recovered')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
