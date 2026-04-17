import { describe, it, expect } from 'vitest'
import {
  computePieceSuggestedPrice,
  JOB_SUGGESTED_PRICE_MATERIAL_MULTIPLIER,
} from './jobSuggestedPrice'
import type { Inventory, Lot, PieceItem } from '@/types/money'

const baseLine = (overrides: Partial<PieceItem>): PieceItem => ({
  id: 'PI1',
  piece_id: 'P1',
  inventory_id: 'INV1',
  quantity: 10,
  ...overrides,
})

const baseInv = (overrides: Partial<Inventory> = {}): Inventory => ({
  id: 'INV1',
  type: 'filament',
  name: 'PLA',
  qty_current: 500,
  warn_yellow: 0,
  warn_orange: 0,
  warn_red: 0,
  created_at: '2025-01-01',
  ...overrides,
})

const baseLot = (overrides: Partial<Lot> = {}): Lot => ({
  id: 'L1',
  inventory_id: 'INV1',
  transaction_id: 'T1',
  quantity: 1000,
  amount: 50,
  created_at: '2025-01-01',
  ...overrides,
})

describe('computePieceSuggestedPrice', () => {
  it('returns hidden when piece has no lines', () => {
    const r = computePieceSuggestedPrice('P1', [], [], [])
    expect(r).toEqual({ kind: 'hidden' })
  })

  it('returns hidden when lines exist but none match piece id', () => {
    const r = computePieceSuggestedPrice(
      'P1',
      [baseLine({ piece_id: 'P2' })],
      [baseInv()],
      [baseLot()],
    )
    expect(r).toEqual({ kind: 'hidden' })
  })

  it('applies multiplier to material subtotal for one piece', () => {
    const lines = [
      baseLine({ id: 'PI1', piece_id: 'P1', quantity: 100 }),
      baseLine({
        id: 'PI2',
        piece_id: 'P2',
        inventory_id: 'INV1',
        quantity: 200,
      }),
    ]
    const inv = baseInv()
    const lot = baseLot({ quantity: 1000, amount: 50 })
    const r = computePieceSuggestedPrice('P1', lines, [inv], [lot])
    expect(r.kind).toBe('ok')
    if (r.kind !== 'ok') return
    expect(r.materialSubtotal).toBeCloseTo(5, 10)
    expect(r.suggestedPrice).toBeCloseTo(
      5 * JOB_SUGGESTED_PRICE_MATERIAL_MULTIPLIER,
      10,
    )

    const r2 = computePieceSuggestedPrice('P2', lines, [inv], [lot])
    expect(r2.kind).toBe('ok')
    if (r2.kind !== 'ok') return
    expect(r2.materialSubtotal).toBeCloseTo(10, 10)
    expect(r2.suggestedPrice).toBeCloseTo(
      10 * JOB_SUGGESTED_PRICE_MATERIAL_MULTIPLIER,
      10,
    )
  })

  it('returns error when no lots for inventory', () => {
    const r = computePieceSuggestedPrice(
      'P1',
      [baseLine({})],
      [baseInv()],
      [],
    )
    expect(r).toEqual({
      kind: 'error',
      lots: [{ id: 'INV1', name: 'PLA' }],
    })
  })

  it('returns error when lots only have zero quantity', () => {
    const r = computePieceSuggestedPrice(
      'P1',
      [baseLine({})],
      [baseInv()],
      [baseLot({ quantity: 0, amount: 10 })],
    )
    expect(r.kind).toBe('error')
    if (r.kind !== 'error') return
    expect(r.lots).toHaveLength(1)
    expect(r.lots[0].id).toBe('INV1')
  })

  it('treats zero total lot amount as zero unit cost', () => {
    const r = computePieceSuggestedPrice(
      'P1',
      [baseLine({ quantity: 500 })],
      [baseInv()],
      [baseLot({ quantity: 1000, amount: 0 })],
    )
    expect(r.kind).toBe('ok')
    if (r.kind !== 'ok') return
    expect(r.materialSubtotal).toBe(0)
    expect(r.suggestedPrice).toBe(0)
  })
})
