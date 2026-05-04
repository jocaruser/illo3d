import { describe, it, expect } from 'vitest'
import type { Inventory, Piece, PieceItem } from '@/types/money'
import { jobFilamentGrams } from './jobFilamentGrams'

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

describe('jobFilamentGrams', () => {
  it('returns 0 when no items', () => {
    expect(jobFilamentGrams([], [], [])).toBe(0)
  })

  it('sums filament quantities only', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 1 })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 }),
      item({ id: 'PI2', piece_id: 'P1', inventory_id: 'INV2', quantity: 50 }),
    ]
    const inventory: Inventory[] = [
      inv({ id: 'INV1', type: 'filament' }),
      inv({ id: 'INV2', type: 'consumable' }),
    ]
    expect(jobFilamentGrams(pieces, items, inventory)).toBe(100)
  })

  it('multiplies by piece units', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 3 })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1', type: 'filament' })]
    expect(jobFilamentGrams(pieces, items, inventory)).toBe(300)
  })

  it('skips items for pieces without units', () => {
    const pieces: Piece[] = [piece({ id: 'P1' })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1', type: 'filament' })]
    expect(jobFilamentGrams(pieces, items, inventory)).toBe(0)
  })

  it('ignores items for pieces not in the provided list', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 1 })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 }),
      item({ id: 'PI2', piece_id: 'P2', inventory_id: 'INV1', quantity: 999 }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1', type: 'filament' })]
    expect(jobFilamentGrams(pieces, items, inventory)).toBe(100)
  })

  it('ignores deleted items', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 1 })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', quantity: 100 }),
      item({ id: 'PI2', piece_id: 'P1', quantity: 50, deleted: 'true' }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1' })]
    expect(jobFilamentGrams(pieces, items, inventory)).toBe(100)
  })
})
