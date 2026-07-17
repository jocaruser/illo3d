import { describe, expect, it } from 'vitest'
import { InventoryItem } from '@/Entity/InventoryItem'
import { Job } from '@/Entity/Job'
import { Lot } from '@/Entity/Lot'
import { Piece } from '@/Entity/Piece'
import { PieceItem } from '@/Entity/PieceItem'
import { expectedBenefit } from '@/Service/Pricing/expectedBenefit'

function job(id: string, status: string, lifecycle?: Record<string, string>): Job {
  return Job.fromRecord({ id, client_id: 'CL1', status, ...lifecycle })
}

function piece(id: string, jobId: string, fields?: Record<string, string>): Piece {
  return Piece.fromRecord({ id, job_id: jobId, price: '10', units: '2', ...fields })
}

function pieceLine(id: string, pieceId: string, fields?: Record<string, string>): PieceItem {
  return PieceItem.fromRecord({
    id,
    piece_id: pieceId,
    inventory_id: 'INV1',
    quantity: '100',
    ...fields,
  })
}

const inventory = [InventoryItem.fromRecord({ id: 'INV1', name: 'PLA' })]
const lots = [Lot.fromRecord({ id: 'L1', inventory_id: 'INV1', quantity: '1000', amount: '20' })]

describe('expectedBenefit', () => {
  it('sums units × price minus units × material cost per qualifying piece', () => {
    const total = expectedBenefit(
      [job('J1', 'draft'), job('J2', 'in_progress')],
      [piece('P1', 'J1'), piece('P2', 'J2', { price: '5', units: '1' })],
      [pieceLine('PI1', 'P1'), pieceLine('PI2', 'P2', { quantity: '50' })],
      inventory,
      lots,
    )
    // P1: 2×10 − 2×(100×0.02)=16; P2: 1×5 − 1×(50×0.02)=4
    expect(total).toBe(20)
  })

  it('skips non-open, inactive jobs and foreign pieces', () => {
    const total = expectedBenefit(
      [job('J1', 'paid'), job('J2', 'draft', { archived: 'true' }), job('J3', 'draft')],
      [piece('P1', 'J1'), piece('P2', 'J2'), piece('P3', 'J9')],
      [pieceLine('PI1', 'P1'), pieceLine('PI2', 'P2'), pieceLine('PI3', 'P3')],
      inventory,
      lots,
    )
    expect(total).toBe(0)
  })

  it('skips deleted, unpriced and lineless pieces', () => {
    const total = expectedBenefit(
      [job('J1', 'draft')],
      [
        piece('P1', 'J1', { deleted: 'true' }),
        piece('P2', 'J1', { price: '' }),
        piece('P3', 'J1'),
        piece('P4', 'J1'),
      ],
      [
        pieceLine('PI1', 'P1'),
        pieceLine('PI2', 'P2'),
        pieceLine('PI4', 'P4', { deleted: 'true' }),
      ],
      inventory,
      lots,
    )
    // Only P3 counts, but it has no lines → skipped too.
    expect(total).toBe(0)
  })

  it('skips pieces whose material cost is not computable', () => {
    const total = expectedBenefit(
      [job('J1', 'draft')],
      [piece('P1', 'J1')],
      [pieceLine('PI1', 'P1', { inventory_id: 'INVX' })],
      inventory,
      lots,
    )
    expect(total).toBe(0)
  })

  it('counts archived pieces on open jobs (counting = non-deleted)', () => {
    const total = expectedBenefit(
      [job('J1', 'draft')],
      [piece('P1', 'J1', { archived: 'true' })],
      [pieceLine('PI1', 'P1')],
      inventory,
      lots,
    )
    expect(total).toBe(16)
  })
})
