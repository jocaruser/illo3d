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
  it('treats no counting pieces as empty', () => {
    expect(jobPricingState('J1', [])).toEqual({ kind: 'empty' })
    expect(canMarkJobPaid('J1', [])).toBe(false)
  })

  it('treats unset piece price as incomplete', () => {
    const pieces = [
      piece({ id: 'P1', job_id: 'J1', price: 10 }),
      piece({ id: 'P2', job_id: 'J1' }),
    ]
    expect(jobPricingState('J1', pieces)).toEqual({ kind: 'incomplete' })
    expect(canMarkJobPaid('J1', pieces)).toBe(false)
  })

  it('sums set prices including archived and excludes deleted', () => {
    const pieces = [
      piece({
        id: 'P1',
        job_id: 'J1',
        price: 10,
        archived: 'true',
      }),
      piece({ id: 'P2', job_id: 'J1', price: 5 }),
      piece({
        id: 'P3',
        job_id: 'J1',
        price: 3,
        deleted: 'true',
      }),
    ]
    expect(jobPricingState('J1', pieces)).toEqual({
      kind: 'complete',
      total: 15,
    })
    expect(canMarkJobPaid('J1', pieces)).toBe(true)
    expect(incomeAmountForPaidJob('J1', pieces)).toBe(15)
  })

  it('allows zero as a set price', () => {
    const pieces = [piece({ id: 'P1', job_id: 'J1', price: 0 })]
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
