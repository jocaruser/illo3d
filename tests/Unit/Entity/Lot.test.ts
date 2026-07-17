import { describe, expect, it } from 'vitest'
import { Lot } from '@/Entity/Lot'

describe('Lot', () => {
  it('round-trips fromRecord/toRecord', () => {
    const record = {
      id: 'L1',
      inventory_id: 'INV1',
      transaction_id: 'T1',
      quantity: '1000',
      amount: '19.99',
      created_at: '2026-01-01T00:00:00.000Z',
      archived: 'true',
      deleted: '',
    }
    const lot = Lot.fromRecord(record)
    expect(lot.quantity).toBe(1000)
    expect(lot.amount).toBe(19.99)
    expect(lot.isArchived()).toBe(true)
    expect(lot.toRecord()).toEqual(record)
  })

  it('defaults missing cells and keeps numerics unset', () => {
    const lot = Lot.fromRecord({})
    expect(lot.quantity).toBeUndefined()
    expect(lot.amount).toBeUndefined()
    expect(lot.toRecord().quantity).toBe('')
    expect(lot.toRecord().amount).toBe('')
  })
})
