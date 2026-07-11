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

  it('uses style tag for custom column overrides', () => {
    const { container } = render(
      <StepGrid columns={{ default: 1, md: 2 }}>
        <div />
      </StepGrid>,
    )
    const grid = container.querySelector('.grid')
    expect(grid).not.toHaveClass('grid-cols-2')
    const styleTag = container.querySelector('style')
    expect(styleTag?.textContent).toContain('repeat(1,minmax(0,1fr))')
    expect(styleTag?.textContent).toContain('@media(min-width:768px)')
    expect(styleTag?.textContent).toContain('repeat(2,minmax(0,1fr))')
  })

  it('injects responsive style tag for breakpoint overrides', () => {
    const { container } = render(
      <StepGrid columns={{ default: 1, sm: 2, md: 3, lg: 4 }}>
        <div />
      </StepGrid>,
    )
    const styleTag = container.querySelector('style')
    expect(styleTag).toBeInTheDocument()
    expect(styleTag?.textContent).toContain('repeat(1,minmax(0,1fr))')
    expect(styleTag?.textContent).toContain('@media(min-width:640px)')
    expect(styleTag?.textContent).toContain('repeat(2,minmax(0,1fr))')
    expect(styleTag?.textContent).toContain('@media(min-width:768px)')
    expect(styleTag?.textContent).toContain('@media(min-width:1024px)')
  })

  it('omits style tag for default layout', () => {
    const { container } = render(
      <StepGrid>
        <div />
      </StepGrid>,
    )
    expect(container.querySelector('style')).not.toBeInTheDocument()
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
