import { describe, it, expect } from 'vitest'
import {
  dashboardExpectedBenefitHasQualifyingPiece,
  dashboardExpectedBenefitTotal,
} from './expectedBenefit'
import type { Inventory, Job, Lot, Piece, PieceItem } from '@/types/money'

describe('dashboardExpectedBenefit', () => {
  const inv: Inventory = {
    id: 'INV1',
    type: 'filament',
    name: 'PLA',
    qty_current: 1000,
    warn_yellow: 0,
    warn_orange: 0,
    warn_red: 0,
    created_at: '2025-01-01',
  }
  const lot: Lot = {
    id: 'L1',
    inventory_id: 'INV1',
    transaction_id: 'T1',
    quantity: 1000,
    amount: 50,
    created_at: '2025-01-01',
  }

  it('sums benefit for draft job with priced units and computable BOM', () => {
    const jobs: Job[] = [
      {
        id: 'J1',
        client_id: 'CL1',
        description: 'Job',
        status: 'draft',
        created_at: '2025-01-01',
      },
    ]
    const pieces: Piece[] = [
      {
        id: 'P1',
        job_id: 'J1',
        name: 'Part',
        status: 'pending',
        price: 30,
        units: 10,
        created_at: '2025-01-01',
      },
    ]
    const pieceItems: PieceItem[] = [
      { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 2 },
    ]
    expect(
      dashboardExpectedBenefitHasQualifyingPiece(
        jobs,
        pieces,
        pieceItems,
        [inv],
        [lot],
      ),
    ).toBe(true)
    const unitCost = 50 / 1000
    const materialRun = 2 * unitCost * 10
    const revenue = 30 * 10
    expect(
      dashboardExpectedBenefitTotal(
        jobs,
        pieces,
        pieceItems,
        [inv],
        [lot],
      ),
    ).toBeCloseTo(revenue - materialRun, 5)
  })

  it('returns false when no qualifying pieces', () => {
    const jobs: Job[] = [
      {
        id: 'J1',
        client_id: 'CL1',
        description: 'Job',
        status: 'draft',
        created_at: '2025-01-01',
      },
    ]
    const pieces: Piece[] = [
      {
        id: 'P1',
        job_id: 'J1',
        name: 'Part',
        status: 'pending',
        price: 30,
        created_at: '2025-01-01',
      },
    ]
    expect(
      dashboardExpectedBenefitHasQualifyingPiece(jobs, pieces, [], [inv], [lot]),
    ).toBe(false)
  })
})
