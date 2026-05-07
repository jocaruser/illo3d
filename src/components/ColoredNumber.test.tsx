import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ColoredNumber } from './ColoredNumber'

describe('ColoredNumber', () => {
  it('renders positive value in green', () => {
    render(<ColoredNumber value={100} formatter={(n) => `$${n}`} />)
    const el = screen.getByText('$100')
    expect(el.className).toMatch(/text-success/)
  })

  it('renders zero value in red', () => {
    render(<ColoredNumber value={0} formatter={(n) => `$${n}`} />)
    const el = screen.getByText('$0')
    expect(el.className).toMatch(/text-danger/)
  })

  it('renders negative value in red', () => {
    render(<ColoredNumber value={-50} formatter={(n) => `$${n}`} />)
    const el = screen.getByText('$-50')
    expect(el.className).toMatch(/text-danger/)
  })

  it('renders with forceRed always red', () => {
    render(<ColoredNumber value={100} forceRed formatter={(n) => `$${n}`} />)
    const el = screen.getByText('$100')
    expect(el.className).toMatch(/text-danger/)
  })

  it('applies additional className', () => {
    render(<ColoredNumber value={100} className="font-bold" />)
    const el = screen.getByText('100')
    expect(el.className).toMatch(/font-bold/)
  })

  it('renders children when provided', () => {
    render(
      <ColoredNumber value={100}>
        <span>Child content</span>
      </ColoredNumber>
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })
})
