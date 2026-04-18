import { describe, it, expect, beforeEach } from 'vitest'
import { archiveInventory } from './lifecycle'
import { matrixToInventory, matrixToLots } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('archiveInventory', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('archives inventory and all active lots for that id', () => {
    resetAndSeedWorkbook({
      inventory: matrixWithRows('inventory', [
        {
          id: 'INV1',
          type: 'filament',
          name: 'PLA',
          qty_current: 100,
          warn_yellow: 0,
          warn_orange: 0,
          warn_red: 0,
          created_at: '2025-01-01',
          archived: '',
          deleted: '',
        },
      ]),
      lots: matrixWithRows('lots', [
        {
          id: 'L1',
          inventory_id: 'INV1',
          transaction_id: 'T1',
          quantity: 50,
          amount: 10,
          created_at: '2025-01-02',
          archived: '',
          deleted: '',
        },
        {
          id: 'L2',
          inventory_id: 'INV1',
          transaction_id: 'T2',
          quantity: 50,
          amount: 10,
          created_at: '2025-01-03',
          archived: '',
          deleted: '',
        },
        {
          id: 'L3',
          inventory_id: 'INV2',
          transaction_id: 'T3',
          quantity: 1,
          amount: 1,
          created_at: '2025-01-04',
          archived: '',
          deleted: '',
        },
      ]),
    })

    archiveInventory('INV1')

    const inv = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    expect(inv.find((r) => r.id === 'INV1')?.archived).toBe('true')

    const lots = matrixToLots(useWorkbookStore.getState().tabs.lots)
    expect(lots.find((l) => l.id === 'L1')?.archived).toBe('true')
    expect(lots.find((l) => l.id === 'L2')?.archived).toBe('true')
    expect(lots.find((l) => l.id === 'L3')?.archived).not.toBe('true')
  })

  it('archives inventory with no lots', () => {
    resetAndSeedWorkbook({
      inventory: matrixWithRows('inventory', [
        {
          id: 'INV1',
          type: 'filament',
          name: 'PLA',
          qty_current: 0,
          warn_yellow: 0,
          warn_orange: 0,
          warn_red: 0,
          created_at: '2025-01-01',
          archived: '',
          deleted: '',
        },
      ]),
    })

    expect(() => archiveInventory('INV1')).not.toThrow()
    const inv = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    expect(inv[0]?.archived).toBe('true')
  })

  it('throws when inventory missing', () => {
    resetAndSeedWorkbook({})
    expect(() => archiveInventory('INV9')).toThrow('Inventory INV9 not found')
  })
})
