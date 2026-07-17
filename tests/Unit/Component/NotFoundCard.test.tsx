import { screen } from '@testing-library/react'
import { NotFoundCard } from '@/Component/NotFoundCard'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('NotFoundCard', () => {
  it('renders the message and a back link', () => {
    renderWithProviders(
      <NotFoundCard message="Client not found." backTo="/clients" backLabel="Back to clients" />
    )

    expect(screen.getByText('Client not found.')).toHaveClass('text-text-muted')
    const link = screen.getByRole('link', { name: 'Back to clients' })
    expect(link).toHaveAttribute('href', '/clients')
    expect(link).toHaveClass('btn-secondary')
  })
})
