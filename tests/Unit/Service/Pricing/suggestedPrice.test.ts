import { describe, expect, it } from 'vitest'
import { InventoryItem } from '@/Entity/InventoryItem'
import { Lot } from '@/Entity/Lot'
import { PieceItem } from '@/Entity/PieceItem'
import { computeSuggestedPrice, SUGGESTED_PRICE_MULTIPLIER } from '@/Service/Pricing/suggestedPrice'

function line(inventoryId: string, quantity: string): PieceItem {
  return PieceItem.fromRecord({ id: 'PI1', piece_id: 'P1', inventory_id: inventoryId, quantity })
}

function item(id: string): InventoryItem {
  return InventoryItem.fromRecord({ id, type: 'filament', name: id })
}

function lot(inventoryId: string, quantity: string, amount: string): Lot {
  return Lot.fromRecord({ id: 'L1', inventory_id: inventoryId, quantity, amount })
}

const inventory = [item('INV1'), item('INV2')]
const lots = [lot('INV1', '1000', '20'), lot('INV2', '10', '5')]

describe('computeSuggestedPrice', () => {
  it('exports the ×3 multiplier', () => {
    expect(SUGGESTED_PRICE_MULTIPLIER).toBe(3)
  })

  it('sums line qty × avg unit cost and multiplies by 3', () => {
    const result = computeSuggestedPrice(
      [line('INV1', '100'), line('INV2', '2')],
      inventory,
      lots,
    )
    // 100 × 0.02 + 2 × 0.5 = 3
    expect(result).toEqual({ error: false, materialSubtotal: 3, suggestedPrice: 9 })
  })

  it('is 0 with no lines', () => {
    expect(computeSuggestedPrice([], inventory, lots)).toEqual({
      error: false,
      materialSubtotal: 0,
      suggestedPrice: 0,
    })
  })

  it('reports missing inventory items', () => {
    expect(computeSuggestedPrice([line('INVX', '1')], inventory, lots)).toEqual({
      error: true,
      missingInventoryIds: ['INVX'],
    })
  })

  it('reports items without a computable average cost', () => {
    expect(computeSuggestedPrice([line('INV1', '1')], inventory, [])).toEqual({
      error: true,
      missingInventoryIds: ['INV1'],
    })
  })

  it('reports lines without a quantity', () => {
    expect(computeSuggestedPrice([line('INV1', '')], inventory, lots)).toEqual({
      error: true,
      missingInventoryIds: ['INV1'],
    })
  })

  it('deduplicates and sorts the missing ids', () => {
    const result = computeSuggestedPrice(
      [line('INVZ', '1'), line('INVA', '1'), line('INVZ', '2'), line('INV1', '10')],
      inventory,
      lots,
    )
    expect(result).toEqual({ error: true, missingInventoryIds: ['INVA', 'INVZ'] })
  })
})
