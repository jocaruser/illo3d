import { describe, it, expect, beforeEach } from 'vitest'
import { createPurchase } from './createPurchase'
import { resetAndSeedWorkbook, matrixWithRows } from '@/test/workbookHarness'
import {
  matrixToInventory,
  matrixToLots,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

describe('createPurchase', () => {
  beforeEach(() => {
    resetAndSeedWorkbook({})
  })

  it('creates overhead transaction only', async () => {
    await createPurchase('s1', {
      date: '2025-01-20',
      category: 'electric',
      notes: 'Bill',
      addToInventory: false,
      amount: 45,
    })
    const txs = matrixToTransactions(useWorkbookStore.getState().tabs.transactions)
    expect(txs).toHaveLength(1)
    expect(txs[0]).toMatchObject({
      type: 'expense',
      amount: -45,
      category: 'electric',
      ref_type: '',
      ref_id: '',
    })
    expect(matrixToLots(useWorkbookStore.getState().tabs.lots)).toHaveLength(0)
  })

  it('creates transaction, lot, and new inventory row', async () => {
    await createPurchase('s1', {
      date: '2025-01-20',
      category: 'filament',
      notes: 'PLA restock',
      addToInventory: true,
      amount: 29.99,
      lines: [
        {
          mode: 'new',
          type: 'filament',
          name: 'PLA White',
          quantity: 1000,
          amount: 29.99,
        },
      ],
    })
    const inv = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    const lots = matrixToLots(useWorkbookStore.getState().tabs.lots)
    expect(inv).toHaveLength(1)
    expect(inv[0].qty_current).toBe(1000)
    expect(lots).toHaveLength(1)
    expect(lots[0].quantity).toBe(1000)
    expect(lots[0].amount).toBe(29.99)
  })

  it('increments existing inventory and appends lot', async () => {
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
    await createPurchase('s1', {
      date: '2025-02-01',
      category: 'filament',
      notes: 'More',
      addToInventory: true,
      amount: 15,
      lines: [
        {
          mode: 'existing',
          inventoryId: 'INV1',
          quantity: 500,
          amount: 15,
        },
      ],
    })
    const inv = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    expect(inv[0].qty_current).toBe(600)
    expect(matrixToLots(useWorkbookStore.getState().tabs.lots)).toHaveLength(1)
  })
})
