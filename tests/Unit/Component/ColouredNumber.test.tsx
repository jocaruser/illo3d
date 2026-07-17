import { screen } from '@testing-library/react'
import { ColouredNumber } from '@/Component/ColouredNumber'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('ColouredNumber', () => {
  it('colors positive values as success', () => {
    renderWithProviders(<ColouredNumber value={12} />)
    expect(screen.getByText('12')).toHaveClass('text-success')
  })

  it('colors negative values as danger', () => {
    renderWithProviders(<ColouredNumber value={-3} />)
    expect(screen.getByText('-3')).toHaveClass('text-danger')
  })

  it('renders zero as muted', () => {
    renderWithProviders(<ColouredNumber value={0} />)
    expect(screen.getByText('0')).toHaveClass('text-text-muted')
  })

  it('forces danger with forceRed even for positive values', () => {
    renderWithProviders(<ColouredNumber value={5} forceRed />)
    expect(screen.getByText('5')).toHaveClass('text-danger')
  })

  it('renders formatted children instead of the raw value', () => {
    renderWithProviders(<ColouredNumber value={-3.5}>-€3.50</ColouredNumber>)
    expect(screen.getByText('-€3.50')).toHaveClass('text-danger')
  })
})
