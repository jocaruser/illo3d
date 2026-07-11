import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StepCard, type StatusVisual } from './StepCard'

const testConfig: Record<string, StatusVisual> = {
  pending: { bg: 'bg-gray-100', text: 'text-gray-400', iconBg: 'bg-gray-300', iconColor: 'text-gray-400', showCheckIcon: false },
  running: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-500', iconColor: 'text-white', showCheckIcon: false, pulse: true },
  done: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-500', iconColor: 'text-white', showCheckIcon: true },
}

const testIcon = <svg data-testid="test-icon" />

describe('StepCard', () => {
  it('renders icon and label', () => {
    render(<StepCard icon={testIcon} label="Clients" status="pending" statusConfig={testConfig} />)
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
  })

  it('shows optional detail line', () => {
    render(<StepCard icon={testIcon} label="Clients" status="pending" detail="3 rows changed" statusConfig={testConfig} />)
    expect(screen.getByText('3 rows changed')).toBeInTheDocument()
  })

  it('omits detail when not provided', () => {
    const { container } = render(<StepCard icon={testIcon} label="Clients" status="pending" statusConfig={testConfig} />)
    expect(container.querySelector('.opacity-70')).not.toBeInTheDocument()
  })

  it('applies background class from status config', () => {
    const { container } = render(<StepCard icon={testIcon} label="Clients" status="pending" statusConfig={testConfig} />)
    expect(container.firstChild).toHaveClass('bg-gray-100')
  })

  it('applies running background and pulse', () => {
    const { container } = render(<StepCard icon={testIcon} label="Clients" status="running" statusConfig={testConfig} />)
    expect(container.firstChild).toHaveClass('bg-blue-50')
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('shows check icon for done status', () => {
    render(<StepCard icon={testIcon} label="Clients" status="done" statusConfig={testConfig} />)
    expect(screen.getByTestId('check-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
  })

  it('uses custom status values from config', () => {
    const customConfig: Record<string, StatusVisual> = {
      archived: { bg: 'bg-yellow-100', text: 'text-yellow-700', iconBg: 'bg-yellow-400', iconColor: 'text-white', showCheckIcon: false },
    }
    const { container } = render(<StepCard icon={testIcon} label="Old" status="archived" statusConfig={customConfig} />)
    expect(container.firstChild).toHaveClass('bg-yellow-100')
  })

  it('has accessible aria-label', () => {
    render(<StepCard icon={testIcon} label="Clients" status="pending" statusConfig={testConfig} />)
    expect(screen.getByLabelText('Clients: pending')).toBeInTheDocument()
  })
})
