import { describe, it, expect } from 'vitest'
import type { Inventory, Piece, PieceItem } from '@/types/money'
import { jobOverallRiskFactor } from './jobOverallRiskFactor'

function makePiece(id: string, job_id: string, units?: number): Piece {
  return { id, job_id, name: `Piece ${id}`, status: 'pending', archived: 'false', deleted: 'false', price: undefined, units } as Piece
}

function makePieceItem(piece_id: string, inventory_id: string, quantity: number): PieceItem {
  return { id: `pi-${piece_id}-${inventory_id}`, piece_id, inventory_id, quantity, archived: 'false', deleted: 'false' } as PieceItem
}

function makeInventory(id: string, name: string, type: string, qty_current: number): Inventory {
  return { id, name, type, qty_current, archived: 'false', deleted: 'false' } as Inventory
}

describe('jobOverallRiskFactor', () => {
  it('returns null when no filament items', () => {
    const pieces = [makePiece('P1', 'J1', 2)]
    const pieceItems: PieceItem[] = []
    const inventory = [makeInventory('I1', 'PLA Red', 'filament', 10)]
    const result = jobOverallRiskFactor(pieces, pieceItems, inventory)
    expect(result).toBeNull()
  })

  it('returns the minimum redos across filament inventories', () => {
    const pieces = [makePiece('P1', 'J1', 2)]
    const pieceItems = [
      makePieceItem('P1', 'I1', 3), // 3 * 2 = 6 units needed, 10 current -> redos = 0
      makePieceItem('P1', 'I2', 2), // 2 * 2 = 4 units needed, 5 current -> redos = 0
    ]
    const inventory = [
      makeInventory('I1', 'PLA Red', 'filament', 10),
      makeInventory('I2', 'ABS Blue', 'filament', 5),
    ]
    const result = jobOverallRiskFactor(pieces, pieceItems, inventory)
    expect(result).not.toBeNull()
    expect(result!.minRedos).toBe(0)
    expect(result!.inventoryName).toBeTruthy()
  })

  it('returns the inventory with lowest redos', () => {
    const pieces = [makePiece('P1', 'J1', 2)]
    const pieceItems = [
      makePieceItem('P1', 'I1', 3), // 6 needed, 20 current -> redos = 2
      makePieceItem('P1', 'I2', 2), // 4 needed, 5 current -> redos = 0
    ]
    const inventory = [
      makeInventory('I1', 'PLA Red', 'filament', 20),
      makeInventory('I2', 'ABS Blue', 'filament', 5),
    ]
    const result = jobOverallRiskFactor(pieces, pieceItems, inventory)
    expect(result!.minRedos).toBe(0)
    expect(result!.inventoryName).toBe('ABS Blue')
  })

  it('ignores non-filament inventories', () => {
    const pieces = [makePiece('P1', 'J1', 2)]
    const pieceItems = [
      makePieceItem('P1', 'I1', 3), // filament
      makePieceItem('P1', 'I2', 5), // consumable - should be ignored
    ]
    const inventory = [
      makeInventory('I1', 'PLA Red', 'filament', 10),
      makeInventory('I2', 'Lubricant', 'consumable', 100),
    ]
    const result = jobOverallRiskFactor(pieces, pieceItems, inventory)
    expect(result!.inventoryName).toBe('PLA Red')
  })

  it('multiplies by piece units', () => {
    const pieces = [makePiece('P1', 'J1', 5)]
    // 2 * 5 = 10 units needed, 10 current -> redos = 0
    const pieceItems = [makePieceItem('P1', 'I1', 2)]
    const inventory = [makeInventory('I1', 'PLA Red', 'filament', 10)]
    const result = jobOverallRiskFactor(pieces, pieceItems, inventory)
    expect(result!.minRedos).toBe(0)
  })

  it('excludes pieces with unset units', () => {
    const pieces = [makePiece('P1', 'J1', undefined)]
    const pieceItems = [makePieceItem('P1', 'I1', 3)]
    const inventory = [makeInventory('I1', 'PLA Red', 'filament', 10)]
    const result = jobOverallRiskFactor(pieces, pieceItems, inventory)
    expect(result).toBeNull()
  })

  it('excludes archived/deleted piece items', () => {
    const pieces = [makePiece('P1', 'J1', 2)]
    const pieceItems = [
      { ...makePieceItem('P1', 'I1', 3), archived: 'true' } as PieceItem,
    ]
    const inventory = [makeInventory('I1', 'PLA Red', 'filament', 10)]
    const result = jobOverallRiskFactor(pieces, pieceItems, inventory)
    expect(result).toBeNull()
  })
})
