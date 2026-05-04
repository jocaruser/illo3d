import { describe, it, expect } from 'vitest'
import type { Inventory, Lot, Piece, PieceItem } from '@/types/money'
import { jobMaterialCost } from './jobMaterialCost'

function inv(partial: Partial<Inventory> & Pick<Inventory, 'id'>): Inventory {
  return {
    type: 'filament',
    name: 'Test',
    qty_current: 1000,
    warn_yellow: 0,
    warn_orange: 0,
    warn_red: 0,
    created_at: '2026-01-01',
    ...partial,
  }
}

function lot(partial: Partial<Lot> & Pick<Lot, 'id'>): Lot {
  return {
    inventory_id: 'INV1',
    transaction_id: 'T1',
    quantity: 1000,
    amount: 10,
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
    quantity: 100,
    ...partial,
  }
}

describe('jobMaterialCost', () => {
  it('returns 0 when no piece items', () => {
    expect(jobMaterialCost([], [], [], [])).toBe(0)
  })

  it('sums quantity × units × avg cost for one inventory', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 1 })]
    const items: PieceItem[] = [item({ id: 'PI1', piece_id: 'P1', quantity: 100 })]
    const inventory: Inventory[] = [inv({ id: 'INV1' })]
    const lots: Lot[] = [lot({ id: 'L1', inventory_id: 'INV1', quantity: 1000, amount: 10 })]
    // avg cost = 0.01 per unit
    expect(jobMaterialCost(pieces, items, inventory, lots)).toBeCloseTo(1, 10)
  })

  it('multiplies by piece units', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 2 })]
    const items: PieceItem[] = [item({ id: 'PI1', piece_id: 'P1', quantity: 100 })]
    const inventory: Inventory[] = [inv({ id: 'INV1' })]
    const lots: Lot[] = [lot({ id: 'L1', inventory_id: 'INV1', quantity: 1000, amount: 10 })]
    // avg cost = 0.01 per unit, units = 2 → 100 * 2 * 0.01 = 2
    expect(jobMaterialCost(pieces, items, inventory, lots)).toBeCloseTo(2, 10)
  })

  it('skips items for pieces without units', () => {
    const pieces: Piece[] = [piece({ id: 'P1' })]
    const items: PieceItem[] = [item({ id: 'PI1', piece_id: 'P1', quantity: 100 })]
    const inventory: Inventory[] = [inv({ id: 'INV1' })]
    const lots: Lot[] = [lot({ id: 'L1', inventory_id: 'INV1', quantity: 1000, amount: 10 })]
    expect(jobMaterialCost(pieces, items, inventory, lots)).toBe(0)
  })

  it('ignores items for pieces not in the provided list', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 1 })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', quantity: 100 }),
      item({ id: 'PI2', piece_id: 'P2', quantity: 999 }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1' })]
    const lots: Lot[] = [lot({ id: 'L1', inventory_id: 'INV1', quantity: 1000, amount: 10 })]
    expect(jobMaterialCost(pieces, items, inventory, lots)).toBeCloseTo(1, 10)
  })

  it('sums across multiple inventories', () => {
    const pieces: Piece[] = [
      piece({ id: 'P1', units: 1 }),
      piece({ id: 'P2', units: 1 }),
    ]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 }),
      item({ id: 'PI2', piece_id: 'P2', inventory_id: 'INV2', quantity: 50 }),
    ]
    const inventory: Inventory[] = [
      inv({ id: 'INV1' }),
      inv({ id: 'INV2' }),
    ]
    const lots: Lot[] = [
      lot({ id: 'L1', inventory_id: 'INV1', quantity: 1000, amount: 10 }),
      lot({ id: 'L2', inventory_id: 'INV2', quantity: 500, amount: 20 }),
    ]
    // INV1: 100 × 0.01 = 1, INV2: 50 × 0.04 = 2
    expect(jobMaterialCost(pieces, items, inventory, lots)).toBeCloseTo(3, 10)
  })

  it('ignores deleted items', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 1 })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', quantity: 100 }),
      item({ id: 'PI2', piece_id: 'P1', quantity: 100, deleted: 'true' }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1' })]
    const lots: Lot[] = [lot({ id: 'L1', inventory_id: 'INV1', quantity: 1000, amount: 10 })]
    expect(jobMaterialCost(pieces, items, inventory, lots)).toBeCloseTo(1, 10)
  })

  it('skips items with missing inventory', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 1 })]
    const items: PieceItem[] = [item({ id: 'PI1', piece_id: 'P1', inventory_id: 'UNKNOWN', quantity: 100 })]
    expect(jobMaterialCost(pieces, items, [], [])).toBe(0)
  })
})
