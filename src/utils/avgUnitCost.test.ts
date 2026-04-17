import { describe, it, expect } from 'vitest'
import type { Lot } from '@/types/money'
import { computeAvgUnitCost } from './avgUnitCost'

function lot(partial: Partial<Lot> & Pick<Lot, 'id'>): Lot {
  return {
    inventory_id: 'INV1',
    transaction_id: 'T1',
    quantity: 1,
    amount: 1,
    created_at: '2026-01-01',
    ...partial,
  }
}

describe('computeAvgUnitCost', () => {
  it('returns null when no lots', () => {
    expect(computeAvgUnitCost([])).toBeNull()
  })

  it('returns weighted average for two lots', () => {
    const lots: Lot[] = [
      lot({ id: 'L1', quantity: 1000, amount: 29.99 }),
      lot({ id: 'L2', quantity: 500, amount: 20 }),
    ]
    expect(computeAvgUnitCost(lots)).toBeCloseTo((29.99 + 20) / 1500, 10)
  })

  it('excludes zero-quantity lots', () => {
    const lots: Lot[] = [
      lot({ id: 'L1', quantity: 0, amount: 10 }),
      lot({ id: 'L2', quantity: 100, amount: 50 }),
    ]
    expect(computeAvgUnitCost(lots)).toBe(0.5)
  })

  it('excludes archived lots', () => {
    const lots: Lot[] = [
      lot({ id: 'L1', quantity: 100, amount: 50, archived: 'true' }),
      lot({ id: 'L2', quantity: 100, amount: 30 }),
    ]
    expect(computeAvgUnitCost(lots)).toBe(0.3)
  })
})
