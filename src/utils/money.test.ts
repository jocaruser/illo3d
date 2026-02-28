import { describe, it, expect } from 'vitest'
import { formatCurrency, calculateBalance } from './money'

describe('formatCurrency', () => {
  it('formats positive amount', () => {
    expect(formatCurrency(45)).toBe('€45.00')
  })

  it('formats negative amount', () => {
    expect(formatCurrency(-25.5)).toBe('-€25.50')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('€0.00')
  })
})

describe('calculateBalance', () => {
  it('sums amounts', () => {
    expect(calculateBalance([45, -25, 10])).toBe(30)
  })

  it('returns 0 for empty array', () => {
    expect(calculateBalance([])).toBe(0)
  })
})
