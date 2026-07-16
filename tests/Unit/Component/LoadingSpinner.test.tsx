import { screen } from '@testing-library/react'
import { LoadingSpinner } from '@/Component/LoadingSpinner'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('LoadingSpinner', () => {
  it('renders a busy status with a spinning icon and accessible text', () => {
    renderWithProviders(<LoadingSpinner />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status.querySelector('svg')).toHaveClass('animate-spin')
    expect(screen.getByText('Loading...')).toHaveClass('sr-only')
  })

  it('merges custom classes', () => {
    renderWithProviders(<LoadingSpinner className="mx-auto" />)
    expect(screen.getByRole('status')).toHaveClass('mx-auto')
  })
})
