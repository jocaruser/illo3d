import { describe, it, expect } from 'vitest'
import type { Inventory, Piece, PieceItem } from '@/types/money'
import { jobConsumableUnits } from './jobConsumableUnits'

function inv(partial: Partial<Inventory> & Pick<Inventory, 'id'>): Inventory {
  return {
    type: 'consumable',
    name: 'Test',
    qty_current: 100,
    warn_yellow: 0,
    warn_orange: 0,
    warn_red: 0,
    created_at: '2026-01-01',
    ...partial,
  }
}

function piece(partial: Partial<Piece> & Pick<Piece, 'id'>): Piece {
  return {
    job_id: 'J1',
    name: 'Test Piece',
    status: 'pending',
    created_at: '2026-01-01',
    ...partial,
  }
}

function item(partial: Partial<PieceItem> & Pick<PieceItem, 'id'>): PieceItem {
  return {
    piece_id: 'P1',
    inventory_id: 'INV1',
    quantity: 2,
    ...partial,
  }
}

describe('jobConsumableUnits', () => {
  it('returns 0 when no items', () => {
    expect(jobConsumableUnits([], [], [])).toBe(0)
  })

  it('sums consumable quantities only', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 1 })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 2 }),
      item({ id: 'PI2', piece_id: 'P1', inventory_id: 'INV2', quantity: 5 }),
    ]
    const inventory: Inventory[] = [
      inv({ id: 'INV1', type: 'consumable' }),
      inv({ id: 'INV2', type: 'filament' }),
    ]
    expect(jobConsumableUnits(pieces, items, inventory)).toBe(2)
  })

  it('multiplies by piece units', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 4 })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 2 }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1', type: 'consumable' })]
    expect(jobConsumableUnits(pieces, items, inventory)).toBe(8)
  })

  it('skips items for pieces without units', () => {
    const pieces: Piece[] = [piece({ id: 'P1' })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 2 }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1', type: 'consumable' })]
    expect(jobConsumableUnits(pieces, items, inventory)).toBe(0)
  })

  it('ignores items for pieces not in the provided list', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 1 })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 2 }),
      item({ id: 'PI2', piece_id: 'P2', inventory_id: 'INV1', quantity: 99 }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1', type: 'consumable' })]
    expect(jobConsumableUnits(pieces, items, inventory)).toBe(2)
  })
})
