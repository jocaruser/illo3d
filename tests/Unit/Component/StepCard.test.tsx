import { screen } from '@testing-library/react'
import { StepCard, type StepStatusConfig } from '@/Component/StepCard'
import { renderWithProviders } from './helpers/renderWithProviders'

const statusConfig: StepStatusConfig = {
  done: { container: 'border-success/40 bg-success/10 text-success', showCheckIcon: true },
  running: { container: 'border-primary/40 bg-primary/10 text-primary' },
}

describe('StepCard', () => {
  it('applies config-driven colors and a check icon for done steps', () => {
    renderWithProviders(<StepCard label="clients" status="done" statusConfig={statusConfig} />)

    expect(screen.getByText('clients').closest('div[class*="rounded-md"]')).toHaveClass(
      'bg-success/10'
    )
    expect(screen.getByTestId('step-check-icon')).toBeInTheDocument()
  })

  it('omits the check icon and pulses for running steps', () => {
    const { container } = renderWithProviders(
      <StepCard label="jobs" status="running" statusConfig={statusConfig} pulse />
    )

    expect(screen.queryByTestId('step-check-icon')).not.toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('animate-pulse', 'bg-primary/10')
  })

  it('falls back to neutral styling for unknown statuses', () => {
    const { container } = renderWithProviders(
      <StepCard label="tags" status="pending" statusConfig={statusConfig} />
    )

    expect(container.firstElementChild).toHaveClass('bg-surface-elevated', 'text-text-muted')
    expect(container.firstElementChild).not.toHaveClass('animate-pulse')
  })

  it('renders optional detail and a custom icon', () => {
    renderWithProviders(
      <StepCard
        label="pieces"
        status="running"
        statusConfig={statusConfig}
        detail="42 of 100"
        icon={<span data-testid="custom-icon" />}
      />
    )

    expect(screen.getByText('42 of 100')).toBeInTheDocument()
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})
