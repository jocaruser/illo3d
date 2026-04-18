import { describe, it, expect } from 'vitest'
import {
  parseLotPurchaseAmountInput,
  parseLotQuantityInput,
} from './updateLotAmount'

describe('parseLotPurchaseAmountInput', () => {
  it('parses positive amounts', () => {
    expect(parseLotPurchaseAmountInput('29.99')).toBe(29.99)
    expect(parseLotPurchaseAmountInput('  10,5 ')).toBe(10.5)
  })

  it('returns null for invalid', () => {
    expect(parseLotPurchaseAmountInput('')).toBeNull()
    expect(parseLotPurchaseAmountInput('0')).toBeNull()
    expect(parseLotPurchaseAmountInput('-5')).toBeNull()
    expect(parseLotPurchaseAmountInput('x')).toBeNull()
  })
})

describe('parseLotQuantityInput', () => {
  it('parses positive quantities', () => {
    expect(parseLotQuantityInput('1000')).toBe(1000)
    expect(parseLotQuantityInput('  1,5 ')).toBe(1.5)
  })

  it('returns null for invalid', () => {
    expect(parseLotQuantityInput('')).toBeNull()
    expect(parseLotQuantityInput('0')).toBeNull()
    expect(parseLotQuantityInput('-1')).toBeNull()
  })
})
