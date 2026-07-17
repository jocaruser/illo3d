import { describe, expect, it } from 'vitest'
import { Piece } from '@/Entity/Piece'
import { jobPricingState } from '@/Service/Pricing/jobPricing'

function piece(fields: Record<string, string>): Piece {
  return Piece.fromRecord({ id: 'P1', job_id: 'J1', ...fields })
}

describe('jobPricingState', () => {
  it('is incomplete with no counting pieces', () => {
    expect(jobPricingState([])).toEqual({ complete: false })
  })

  it('is incomplete when any piece lacks price or units', () => {
    expect(jobPricingState([piece({ price: '10', units: '2' }), piece({ units: '1' })])).toEqual({
      complete: false,
    })
    expect(jobPricingState([piece({ price: '10' })])).toEqual({ complete: false })
  })

  it('totals price × units over all pieces when complete', () => {
    expect(
      jobPricingState([piece({ price: '10', units: '2' }), piece({ price: '0.5', units: '4' })]),
    ).toEqual({ complete: true, total: 22 })
  })

  it('allows 0-priced pieces', () => {
    expect(jobPricingState([piece({ price: '0', units: '3' })])).toEqual({
      complete: true,
      total: 0,
    })
  })
})
