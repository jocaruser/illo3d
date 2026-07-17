import { screen } from '@testing-library/react'
import { StepGrid } from '@/Component/StepGrid'
import { renderWithProviders } from './helpers/renderWithProviders'

describe('StepGrid', () => {
  it('renders nothing without children', () => {
    const { container } = renderWithProviders(<StepGrid label="Sheets" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a responsive grid with an optional label', () => {
    renderWithProviders(
      <StepGrid label="Sheets">
        <span>one</span>
        <span>two</span>
      </StepGrid>
    )

    expect(screen.getByRole('heading', { level: 3, name: 'Sheets' })).toHaveClass('font-display')
    expect(screen.getByText('one').parentElement).toHaveClass(
      'grid',
      'grid-cols-2',
      'sm:grid-cols-3',
      'md:grid-cols-4'
    )
  })

  it('renders without a label', () => {
    renderWithProviders(
      <StepGrid>
        <span>one</span>
      </StepGrid>
    )

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.getByText('one')).toBeInTheDocument()
  })
})
