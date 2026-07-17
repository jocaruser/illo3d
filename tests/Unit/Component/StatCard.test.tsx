import { screen } from '@testing-library/react'
import { StatCard } from '@/Component/StatCard'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('StatCard', () => {
  it('renders a neutral stat by default', () => {
    renderWithProviders(<StatCard label="Balance" value="€120.00" />)

    expect(screen.getByText('Balance')).toHaveClass('uppercase', 'text-text-muted')
    const value = screen.getByText('€120.00')
    expect(value).toHaveClass('font-display', 'text-text')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('colors positive and negative tones', () => {
    renderWithProviders(
      <>
        <StatCard label="Up" value="+5" tone="positive" />
        <StatCard label="Down" value="-5" tone="negative" />
      </>
    )

    expect(screen.getByText('+5')).toHaveClass('text-success')
    expect(screen.getByText('-5')).toHaveClass('text-danger')
  })

  it('becomes a router link with lift when to is set', () => {
    renderWithProviders(<StatCard label="Jobs" value="4" to="/jobs" />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/jobs')
    expect(link).toHaveClass('card-hover-lift', 'bg-surface-elevated')
  })
})
