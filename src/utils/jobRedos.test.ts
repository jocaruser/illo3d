import { describe, it, expect } from 'vitest'
import type { Inventory } from '@/types/money'
import { computeRedos, jobMinimumRedos } from './jobRedos'

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

describe('computeRedos', () => {
  it('returns safe for many redos', () => {
    const inventory = inv({ id: 'INV1', qty_current: 1000 })
    expect(computeRedos(inventory, 50)).toEqual({ redos: 19, band: 'safe' })
  })

  it('returns tight for exactly 1 redo', () => {
    const inventory = inv({ id: 'INV1', qty_current: 100 })
    expect(computeRedos(inventory, 50)).toEqual({ redos: 1, band: 'tight' })
  })

  it('returns risky for 0 redos', () => {
    const inventory = inv({ id: 'INV1', qty_current: 50 })
    expect(computeRedos(inventory, 50)).toEqual({ redos: 0, band: 'risky' })
  })

  it('returns risky when qty < quantity', () => {
    const inventory = inv({ id: 'INV1', qty_current: 30 })
    expect(computeRedos(inventory, 50)).toEqual({ redos: 0, band: 'risky' })
  })
})

describe('jobMinimumRedos', () => {
  it('returns null when no filament quantities', () => {
    expect(jobMinimumRedos([], new Map())).toBeNull()
  })

  it('finds minimum redos across filament items', () => {
    const inventory = [
      inv({ id: 'INV1', name: 'PLA', qty_current: 1000 }),
      inv({ id: 'INV2', name: 'PETG', qty_current: 100 }),
    ]
    const quantities = new Map([
      ['INV1', 50],
      ['INV2', 50],
    ])
    const result = jobMinimumRedos(inventory, quantities)
    expect(result).toEqual({ minRedos: 1, inventoryName: 'PETG' })
  })

  it('ignores non-filament inventory', () => {
    const inventory = [
      inv({ id: 'INV1', name: 'PLA', qty_current: 100 }),
      inv({ id: 'INV2', name: 'Nozzle', type: 'consumable', qty_current: 5 }),
    ]
    const quantities = new Map([
      ['INV1', 50],
      ['INV2', 2],
    ])
    const result = jobMinimumRedos(inventory, quantities)
    expect(result).toEqual({ minRedos: 1, inventoryName: 'PLA' })
  })
})
