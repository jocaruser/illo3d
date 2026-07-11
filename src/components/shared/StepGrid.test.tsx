import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StepGrid } from './StepGrid'

describe('StepGrid', () => {
  it('renders children in a grid', () => {
    render(
      <StepGrid>
        <div data-testid="child-1" />
        <div data-testid="child-2" />
      </StepGrid>,
    )
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })

  it('applies default responsive column classes', () => {
    const { container } = render(
      <StepGrid>
        <div />
      </StepGrid>,
    )
    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid-cols-2')
    expect(grid).toHaveClass('sm:grid-cols-3')
    expect(grid).toHaveClass('md:grid-cols-4')
  })

  it('uses inline style for custom column overrides', () => {
    const { container } = render(
      <StepGrid columns={{ default: 1, md: 2 }}>
        <div />
      </StepGrid>,
    )
    const grid = container.querySelector('.grid')
    expect(grid).not.toHaveClass('grid-cols-2')
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' })
  })

  it('renders label when provided', () => {
    render(
      <StepGrid label="My Steps">
        <div />
      </StepGrid>,
    )
    expect(screen.getByText('My Steps')).toBeInTheDocument()
  })

  it('renders without error when empty', () => {
    const { container } = render(<StepGrid>{null}</StepGrid>)
    expect(container.querySelector('.grid')).toBeInTheDocument()
  })
})
