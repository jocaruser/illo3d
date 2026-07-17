import { describe, expect, it } from 'vitest'
import { Transaction } from '@/Entity/Transaction'
import { calculateBalance, formatCurrency } from '@/Service/Pricing/money'

describe('formatCurrency', () => {
  it('formats with a € prefix and two decimals', () => {
    expect(formatCurrency(12.34)).toBe('€12.34')
    expect(formatCurrency(0)).toBe('€0.00')
    expect(formatCurrency(7)).toBe('€7.00')
    expect(formatCurrency(1.005)).toBe('€1.00')
  })

  it('places the minus before the € sign', () => {
    expect(formatCurrency(-5)).toBe('-€5.00')
    expect(formatCurrency(-0.5)).toBe('-€0.50')
  })
})

describe('calculateBalance', () => {
  function transaction(amount: string, lifecycle?: { archived?: string; deleted?: string }) {
    return Transaction.fromRecord({ id: 'T1', type: 'income', amount, ...lifecycle })
  }

  it('sums active amounts with sign', () => {
    expect(calculateBalance([transaction('10'), transaction('-4.5')])).toBe(5.5)
  })

  it('skips archived/deleted rows and unset amounts', () => {
    expect(
      calculateBalance([
        transaction('10'),
        transaction('99', { archived: 'true' }),
        transaction('99', { deleted: 'true' }),
        transaction(''),
      ]),
    ).toBe(10)
  })

  it('is 0 for an empty list', () => {
    expect(calculateBalance([])).toBe(0)
  })
})
