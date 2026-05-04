import { describe, it, expect } from 'vitest'
import type { Inventory, Lot, Piece, PieceItem } from '@/types/money'
import { buildMaterialsSummary } from './jobMaterialsSummary'

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
    name: 'Piece A',
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

describe('buildMaterialsSummary', () => {
  it('returns empty array when no piece items', () => {
    expect(buildMaterialsSummary('J1', [], [], [], [])).toEqual([])
  })

  it('aggregates by inventory and computes cost', () => {
    const pieces: Piece[] = [piece({ id: 'P1', name: 'Piece A', units: 1 })]
    const items: PieceItem[] = [item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 })]
    const inventory: Inventory[] = [inv({ id: 'INV1', name: 'PLA White' })]
    const lots: Lot[] = [lot({ id: 'L1', inventory_id: 'INV1', quantity: 1000, amount: 10 })]

    const result = buildMaterialsSummary('J1', pieces, items, inventory, lots)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      inventoryId: 'INV1',
      inventoryName: 'PLA White',
      totalQuantity: 100,
      usedInPieces: ['Piece A'],
    })
    expect(result[0].estimatedCost).toBeCloseTo(1, 10)
    expect(result[0].remainingQty).toBe(900) // 1000 - 100
  })

  it('multiplies by piece units and computes remaining qty', () => {
    const pieces: Piece[] = [piece({ id: 'P1', name: 'Piece A', units: 3 })]
    const items: PieceItem[] = [item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 })]
    const inventory: Inventory[] = [inv({ id: 'INV1', name: 'PLA White', qty_current: 500 })]
    const lots: Lot[] = [lot({ id: 'L1', inventory_id: 'INV1', quantity: 1000, amount: 10 })]

    const result = buildMaterialsSummary('J1', pieces, items, inventory, lots)
    expect(result[0].totalQuantity).toBe(300)
    expect(result[0].estimatedCost).toBeCloseTo(3, 10)
    expect(result[0].remainingQty).toBe(200) // 500 - 300
  })

  it('skips pieces without units', () => {
    const pieces: Piece[] = [piece({ id: 'P1', name: 'Piece A' })]
    const items: PieceItem[] = [item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 })]
    const inventory: Inventory[] = [inv({ id: 'INV1', name: 'PLA White' })]

    const result = buildMaterialsSummary('J1', pieces, items, inventory, [])
    expect(result).toHaveLength(0)
  })

  it('ignores items for pieces not in the job', () => {
    const pieces: Piece[] = [piece({ id: 'P1', name: 'Piece A', units: 1, job_id: 'J1' })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 }),
      item({ id: 'PI2', piece_id: 'P2', inventory_id: 'INV1', quantity: 999 }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1', name: 'PLA White' })]

    const result = buildMaterialsSummary('J1', pieces, items, inventory, [])
    expect(result).toHaveLength(1)
    expect(result[0].totalQuantity).toBe(100)
  })

  it('aggregates multiple pieces using same inventory', () => {
    const pieces: Piece[] = [
      piece({ id: 'P1', name: 'Piece A', units: 1 }),
      piece({ id: 'P2', name: 'Piece B', units: 1 }),
    ]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 }),
      item({ id: 'PI2', piece_id: 'P2', inventory_id: 'INV1', quantity: 200 }),
    ]
    const inventory: Inventory[] = [inv({ id: 'INV1', name: 'PLA' })]
    const lots: Lot[] = [lot({ id: 'L1', inventory_id: 'INV1', quantity: 1000, amount: 10 })]

    const result = buildMaterialsSummary('J1', pieces, items, inventory, lots)
    expect(result[0].totalQuantity).toBe(300)
    expect(result[0].usedInPieces).toContain('Piece A')
    expect(result[0].usedInPieces).toContain('Piece B')
  })

  it('sorts by type then name', () => {
    const pieces: Piece[] = [piece({ id: 'P1', name: 'Piece A', units: 1 })]
    const items: PieceItem[] = [
      item({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV2', quantity: 50 }),
      item({ id: 'PI2', piece_id: 'P1', inventory_id: 'INV1', quantity: 100 }),
    ]
    const inventory: Inventory[] = [
      inv({ id: 'INV1', name: 'PLA', type: 'filament' }),
      inv({ id: 'INV2', name: 'Nozzle', type: 'consumable' }),
    ]
    const lots: Lot[] = []

    const result = buildMaterialsSummary('J1', pieces, items, inventory, lots)
    expect(result[0].inventoryName).toBe('PLA')
    expect(result[1].inventoryName).toBe('Nozzle')
  })

  it('returns null cost when no lots', () => {
    const pieces: Piece[] = [piece({ id: 'P1', units: 1 })]
    const items: PieceItem[] = [item({ id: 'PI1', piece_id: 'P1', quantity: 100 })]
    const inventory: Inventory[] = [inv({ id: 'INV1' })]

    const result = buildMaterialsSummary('J1', pieces, items, inventory, [])
    expect(result[0].estimatedCost).toBeNull()
  })
})
