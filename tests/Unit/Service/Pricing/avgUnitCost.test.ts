import { describe, expect, it } from 'vitest'
import { Lot } from '@/Entity/Lot'
import { computeAvgUnitCost } from '@/Service/Pricing/avgUnitCost'

function lot(fields: Record<string, string>): Lot {
  return Lot.fromRecord({ id: 'L1', inventory_id: 'INV1', ...fields })
}

describe('computeAvgUnitCost', () => {
  it('weights the average by quantity', () => {
    expect(
      computeAvgUnitCost([lot({ quantity: '1000', amount: '20' }), lot({ quantity: '500', amount: '25' })]),
    ).toBe(45 / 1500)
  })

  it('excludes inactive lots', () => {
    expect(
      computeAvgUnitCost([
        lot({ quantity: '100', amount: '10' }),
        lot({ quantity: '100', amount: '90', archived: 'true' }),
        lot({ quantity: '100', amount: '90', deleted: 'true' }),
      ]),
    ).toBe(0.1)
  })

  it('excludes lots without a positive quantity or without an amount', () => {
    expect(
      computeAvgUnitCost([
        lot({ quantity: '100', amount: '10' }),
        lot({ quantity: '0', amount: '99' }),
        lot({ quantity: '-5', amount: '99' }),
        lot({ quantity: '', amount: '99' }),
        lot({ quantity: '100', amount: '' }),
      ]),
    ).toBe(0.1)
  })

  it('returns null when nothing qualifies', () => {
    expect(computeAvgUnitCost([])).toBeNull()
    expect(computeAvgUnitCost([lot({ quantity: '', amount: '5' })])).toBeNull()
  })

  it('allows a 0 amount (free lot lowers the average)', () => {
    expect(
      computeAvgUnitCost([lot({ quantity: '100', amount: '10' }), lot({ quantity: '100', amount: '0' })]),
    ).toBe(0.05)
  })
})
