import { describe, it, expect } from 'vitest'
import { isExpenseLotSumMismatch } from './expenseLotAmountMismatch'

describe('isExpenseLotSumMismatch', () => {
  it('returns false when there are no lots', () => {
    expect(isExpenseLotSumMismatch([], -100)).toBe(false)
  })

  it('returns false when sum matches abs(transaction amount)', () => {
    expect(isExpenseLotSumMismatch([29.99], -29.99)).toBe(false)
    expect(isExpenseLotSumMismatch([10, 20], -30)).toBe(false)
  })

  it('returns false at epsilon boundary (within tolerance)', () => {
    expect(isExpenseLotSumMismatch([10.005], -10)).toBe(false)
  })

  it('returns true when difference exceeds epsilon', () => {
    expect(isExpenseLotSumMismatch([29.99], -10)).toBe(true)
    expect(isExpenseLotSumMismatch([10, 20], -29)).toBe(true)
  })
})
