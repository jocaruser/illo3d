import { describe, it, expect, beforeEach } from 'vitest'
import { deleteExpense } from './deleteExpense'
import {
  matrixToExpenses,
  matrixToInventory,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('deleteExpense', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('archives expense, linked transaction, and inventory', async () => {
    resetAndSeedWorkbook({
      expenses: matrixWithRows('expenses', [
        {
          id: 'E1',
          date: '2025-01-01',
          category: 'other',
          amount: '1',
          notes: '',
        },
        {
          id: 'E2',
          date: '2025-01-02',
          category: 'other',
          amount: '2',
          notes: '',
        },
      ]),
      inventory: matrixWithRows('inventory', [
        {
          id: 'INV1',
          expense_id: 'E2',
          type: 'filament',
          name: 'x',
          qty_initial: '1',
          qty_current: '1',
          created_at: '2025-01-01T00:00:00.000Z',
        },
      ]),
      transactions: matrixWithRows('transactions', [
        {
          id: 'T1',
          date: '2025-01-01',
          type: 'expense',
          amount: '-1',
          category: '',
          concept: '',
          ref_type: 'expense',
          ref_id: 'E1',
          client_id: '',
          notes: '',
        },
        {
          id: 'T2',
          date: '2025-01-02',
          type: 'expense',
          amount: '-2',
          category: '',
          concept: '',
          ref_type: 'expense',
          ref_id: 'E2',
          client_id: '',
          notes: '',
        },
      ]),
    })

    await deleteExpense('s1', 'E2')

    const expenses = matrixToExpenses(useWorkbookStore.getState().tabs.expenses)
    const txs = matrixToTransactions(
      useWorkbookStore.getState().tabs.transactions,
    )
    const inv = matrixToInventory(useWorkbookStore.getState().tabs.inventory)

    expect(expenses.find((e) => e.id === 'E1')?.archived).not.toBe('true')
    expect(expenses.find((e) => e.id === 'E2')?.archived).toBe('true')
    expect(txs.find((t) => t.id === 'T1')?.archived).not.toBe('true')
    expect(txs.find((t) => t.id === 'T2')?.archived).toBe('true')
    expect(inv[0]?.archived).toBe('true')
  })
})
