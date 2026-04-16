import { describe, it, expect } from 'vitest'
import { materialCostForPieceItemLine } from './pieceItemMaterialCost'
import type { Expense, Inventory, PieceItem } from '@/types/money'

const line = (overrides: Partial<PieceItem>): PieceItem => ({
  id: 'PI1',
  piece_id: 'P1',
  inventory_id: 'INV1',
  quantity: 100,
  ...overrides,
})

const inv = (overrides: Partial<Inventory>): Inventory => ({
  id: 'INV1',
  expense_id: 'E1',
  type: 'filament',
  name: 'PLA',
  qty_initial: 1000,
  qty_current: 500,
  created_at: '2025-01-01',
  ...overrides,
})

const exp = (overrides: Partial<Expense>): Expense => ({
  id: 'E1',
  date: '2025-01-01',
  category: 'filament',
  amount: 50,
  ...overrides,
})

describe('materialCostForPieceItemLine', () => {
  it('returns quantity × unit cost from expense and initial qty', () => {
    const c = materialCostForPieceItemLine(
      line({ quantity: 200 }),
      [inv({ qty_initial: 1000 })],
      [exp({ amount: 50 })],
    )
    expect(c).toBeCloseTo(10, 10)
  })

  it('returns null when inventory is missing', () => {
    expect(
      materialCostForPieceItemLine(line({}), [], [exp({})]),
    ).toBeNull()
  })

  it('returns null when expense is missing', () => {
    expect(materialCostForPieceItemLine(line({}), [inv({})], [])).toBeNull()
  })

  it('treats zero expense amount as zero cost', () => {
    expect(
      materialCostForPieceItemLine(
        line({ quantity: 500 }),
        [inv({ qty_initial: 1000 })],
        [exp({ amount: 0 })],
      ),
    ).toBe(0)
  })
})
