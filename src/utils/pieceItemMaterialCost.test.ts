import { describe, it, expect } from 'vitest'
import { materialCostForPieceItemLine } from './pieceItemMaterialCost'
import type { Inventory, Lot, PieceItem } from '@/types/money'

const line = (overrides: Partial<PieceItem>): PieceItem => ({
  id: 'PI1',
  piece_id: 'P1',
  inventory_id: 'INV1',
  quantity: 100,
  ...overrides,
})

const inv = (overrides: Partial<Inventory>): Inventory => ({
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

const lot = (overrides: Partial<Lot>): Lot => ({
  id: 'L1',
  inventory_id: 'INV1',
  transaction_id: 'T1',
  quantity: 1000,
  amount: 50,
  created_at: '2025-01-01',
  ...overrides,
})

describe('materialCostForPieceItemLine', () => {
  it('returns quantity × avg unit cost from lots', () => {
    const c = materialCostForPieceItemLine(
      line({ quantity: 200 }),
      [inv({})],
      [lot({ quantity: 1000, amount: 50 })],
    )
    expect(c).toBeCloseTo(10, 10)
  })

  it('returns null when inventory is missing', () => {
    expect(materialCostForPieceItemLine(line({}), [], [lot({})])).toBeNull()
  })

  it('returns null when no lots for inventory', () => {
    expect(materialCostForPieceItemLine(line({}), [inv({})], [])).toBeNull()
  })

  it('treats zero lot amount as zero cost', () => {
    expect(
      materialCostForPieceItemLine(
        line({ quantity: 500 }),
        [inv({})],
        [lot({ quantity: 1000, amount: 0 })],
      ),
    ).toBe(0)
  })
})
