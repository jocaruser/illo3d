import { describe, it, expect, beforeEach } from 'vitest'
import { updateInventoryThresholds } from './updateInventoryThresholds'
import { matrixToInventory } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('updateInventoryThresholds', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('updates threshold columns by inventory id', async () => {
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
        },
      ]),
    })

    await updateInventoryThresholds('s1', 'INV1', {
      warn_yellow: 300,
      warn_orange: 150,
      warn_red: 50,
    })

    const rows = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    expect(rows[0]).toMatchObject({
      id: 'INV1',
      name: 'PLA',
      qty_current: 100,
      warn_yellow: 300,
      warn_orange: 150,
      warn_red: 50,
    })
  })

  it('throws when inventory missing', async () => {
    resetAndSeedWorkbook({})

    await expect(
      updateInventoryThresholds('s1', 'INV9', {
        warn_yellow: 1,
        warn_orange: 2,
        warn_red: 3,
      })
    ).rejects.toThrow('Inventory INV9 not found')
  })
})
