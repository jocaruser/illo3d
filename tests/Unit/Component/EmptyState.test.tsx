import { screen } from '@testing-library/react'
import { EmptyState } from '@/Component/EmptyState'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('EmptyState', () => {
  it('renders a centered muted message', () => {
    renderWithProviders(<EmptyState message="No clients yet." />)
    const message = screen.getByText('No clients yet.')
    expect(message).toHaveClass('text-text-muted')
    expect(message.parentElement).toHaveClass('text-center')
  })

  it('renders an optional action', () => {
    renderWithProviders(
      <EmptyState message="No jobs." action={<button type="button">Add job</button>} />
    )
    expect(screen.getByRole('button', { name: 'Add job' })).toBeInTheDocument()
  })
})
