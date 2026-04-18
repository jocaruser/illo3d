import { describe, it, expect, beforeEach } from 'vitest'
import { updateInventoryQtyCurrent } from './updateInventoryQtyCurrent'
import { matrixToInventory } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('updateInventoryQtyCurrent', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('updates qty_current and preserves thresholds', async () => {
    resetAndSeedWorkbook({
      inventory: matrixWithRows('inventory', [
        {
          id: 'INV1',
          type: 'filament',
          name: 'PLA',
          qty_current: 100,
          warn_yellow: 10,
          warn_orange: 5,
          warn_red: 1,
          created_at: '2025-01-01',
        },
      ]),
    })

    await updateInventoryQtyCurrent('s1', 'INV1', 250)

    const rows = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    expect(rows[0]).toMatchObject({
      id: 'INV1',
      qty_current: 250,
      warn_yellow: 10,
      warn_orange: 5,
      warn_red: 1,
    })
  })

  it('floors fractional input and rejects negatives via clamp', async () => {
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

    await updateInventoryQtyCurrent('s1', 'INV1', 12.9)
    let rows = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    expect(rows[0].qty_current).toBe(12)

    await updateInventoryQtyCurrent('s1', 'INV1', -5)
    rows = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    expect(rows[0].qty_current).toBe(0)
  })

  it('throws when inventory missing', async () => {
    resetAndSeedWorkbook({})

    await expect(updateInventoryQtyCurrent('s1', 'INV9', 1)).rejects.toThrow(
      'Inventory INV9 not found',
    )
  })
})
