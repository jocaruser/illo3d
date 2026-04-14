import { describe, it, expect } from 'vitest'
import {
  computeJobSuggestedPrice,
  JOB_SUGGESTED_PRICE_MATERIAL_MULTIPLIER,
} from './jobSuggestedPrice'
import type { Expense, Inventory, Piece, PieceItem } from '@/types/money'

const basePiece = (overrides: Partial<Piece>): Piece => ({
  id: 'P1',
  job_id: 'J1',
  name: 'Part',
  status: 'pending',
  created_at: '2025-01-01',
  ...overrides,
})

const baseLine = (overrides: Partial<PieceItem>): PieceItem => ({
  id: 'PI1',
  piece_id: 'P1',
  inventory_id: 'INV1',
  quantity: 10,
  ...overrides,
})

const baseInv = (overrides: Partial<Inventory> = {}): Inventory => ({
  id: 'INV1',
  expense_id: 'E1',
  type: 'filament',
  name: 'PLA',
  qty_initial: 1000,
  qty_current: 500,
  created_at: '2025-01-01',
  ...overrides,
})

const baseExp = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'E1',
  date: '2025-01-01',
  category: 'filament',
  amount: 30,
  ...overrides,
})

describe('computeJobSuggestedPrice', () => {
  it('returns hidden when job has no pieces', () => {
    const r = computeJobSuggestedPrice('J1', [], [], [], [])
    expect(r).toEqual({ kind: 'hidden' })
  })

  it('returns hidden when pieces exist but no piece_items', () => {
    const r = computeJobSuggestedPrice(
      'J1',
      [basePiece({ id: 'P1' })],
      [],
      [baseInv()],
      [baseExp()]
    )
    expect(r).toEqual({ kind: 'hidden' })
  })

  it('sums pending and done pieces and applies multiplier', () => {
    const pieces = [
      basePiece({ id: 'P1', status: 'pending' }),
      basePiece({ id: 'P2', job_id: 'J1', status: 'done' }),
    ]
    const lines = [
      baseLine({ id: 'L1', piece_id: 'P1', quantity: 100 }),
      baseLine({
        id: 'L2',
        piece_id: 'P2',
        inventory_id: 'INV1',
        quantity: 200,
      }),
    ]
    const inv = baseInv({ qty_initial: 1000 })
    const exp = baseExp({ amount: 50 })
    const r = computeJobSuggestedPrice('J1', pieces, lines, [inv], [exp])
    expect(r.kind).toBe('ok')
    if (r.kind !== 'ok') return
    expect(r.materialSubtotal).toBeCloseTo(15, 10)
    expect(r.suggestedPrice).toBeCloseTo(
      15 * JOB_SUGGESTED_PRICE_MATERIAL_MULTIPLIER,
      10
    )
  })

  it('returns error when expense missing', () => {
    const r = computeJobSuggestedPrice(
      'J1',
      [basePiece({ id: 'P1' })],
      [baseLine({})],
      [baseInv()],
      []
    )
    expect(r).toEqual({
      kind: 'error',
      lots: [{ id: 'INV1', name: 'PLA' }],
    })
  })

  it('returns error when qty_initial not positive', () => {
    const r = computeJobSuggestedPrice(
      'J1',
      [basePiece({ id: 'P1' })],
      [baseLine({})],
      [baseInv({ qty_initial: 0 })],
      [baseExp()]
    )
    expect(r.kind).toBe('error')
    if (r.kind !== 'error') return
    expect(r.lots).toHaveLength(1)
    expect(r.lots[0].id).toBe('INV1')
  })

  it('treats zero expense amount as zero unit cost', () => {
    const r = computeJobSuggestedPrice(
      'J1',
      [basePiece({ id: 'P1' })],
      [baseLine({ quantity: 500 })],
      [baseInv({ qty_initial: 1000 })],
      [baseExp({ amount: 0 })]
    )
    expect(r.kind).toBe('ok')
    if (r.kind !== 'ok') return
    expect(r.materialSubtotal).toBe(0)
    expect(r.suggestedPrice).toBe(0)
  })
})
