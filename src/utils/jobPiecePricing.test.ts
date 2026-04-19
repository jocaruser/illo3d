import { describe, it, expect } from 'vitest'
import {
  canMarkJobPaid,
  incomeAmountForPaidJob,
  jobPricingState,
  jobTotalSortValue,
} from './jobPiecePricing'
import type { Piece } from '@/types/money'

const piece = (overrides: Partial<Piece> & Pick<Piece, 'id' | 'job_id'>): Piece => ({
  name: 'n',
  status: 'pending',
  created_at: '2025-01-01',
  ...overrides,
})

describe('jobPiecePricing', () => {
  it('treats no counting pieces as incomplete pricing', () => {
    expect(jobPricingState('J1', [])).toEqual({ kind: 'incomplete' })
    expect(canMarkJobPaid('J1', [])).toBe(false)
    expect(jobTotalSortValue('J1', [])).toBe(Number.POSITIVE_INFINITY)
  })

  it('treats unset piece price as incomplete', () => {
    const pieces = [
      piece({ id: 'P1', job_id: 'J1', price: 10, units: 1 }),
      piece({ id: 'P2', job_id: 'J1', units: 1 }),
    ]
    expect(jobPricingState('J1', pieces)).toEqual({ kind: 'incomplete' })
    expect(canMarkJobPaid('J1', pieces)).toBe(false)
  })

  it('treats unset piece units as incomplete', () => {
    const pieces = [piece({ id: 'P1', job_id: 'J1', price: 10 })]
    expect(jobPricingState('J1', pieces)).toEqual({ kind: 'incomplete' })
    expect(canMarkJobPaid('J1', pieces)).toBe(false)
  })

  it('sums units times price including archived and excludes deleted', () => {
    const pieces = [
      piece({
        id: 'P1',
        job_id: 'J1',
        price: 10,
        units: 2,
        archived: 'true',
      }),
      piece({ id: 'P2', job_id: 'J1', price: 5, units: 1 }),
      piece({
        id: 'P3',
        job_id: 'J1',
        price: 3,
        units: 1,
        deleted: 'true',
      }),
    ]
    expect(jobPricingState('J1', pieces)).toEqual({
      kind: 'complete',
      total: 25,
    })
    expect(canMarkJobPaid('J1', pieces)).toBe(true)
    expect(incomeAmountForPaidJob('J1', pieces)).toBe(25)
  })

  it('allows zero as a set price', () => {
    const pieces = [piece({ id: 'P1', job_id: 'J1', price: 0, units: 3 })]
    expect(jobPricingState('J1', pieces)).toEqual({ kind: 'complete', total: 0 })
    expect(incomeAmountForPaidJob('J1', pieces)).toBe(0)
  })

  it('sort helper uses infinity for incomplete totals', () => {
    const pieces = [piece({ id: 'P1', job_id: 'J1' })]
    expect(jobTotalSortValue('J1', pieces)).toBe(Number.POSITIVE_INFINITY)
  })

  it('throws when income amount requested for incomplete pricing', () => {
    const pieces = [piece({ id: 'P1', job_id: 'J1' })]
    expect(() => incomeAmountForPaidJob('J1', pieces)).toThrow(
      /incomplete|priced/i,
    )
  })
})
