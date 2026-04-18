import { describe, it, expect } from 'vitest'
import { parseExpenseAmountInput } from './updateTransactionAmount'

describe('parseExpenseAmountInput', () => {
  it('normalizes positive input to negative expense', () => {
    expect(parseExpenseAmountInput('29.99')).toBe(-29.99)
    expect(parseExpenseAmountInput('  10,5 ')).toBe(-10.5)
  })

  it('accepts negative values', () => {
    expect(parseExpenseAmountInput('-15')).toBe(-15)
  })

  it('returns null for invalid', () => {
    expect(parseExpenseAmountInput('')).toBeNull()
    expect(parseExpenseAmountInput('abc')).toBeNull()
    expect(parseExpenseAmountInput('0')).toBeNull()
  })
})
