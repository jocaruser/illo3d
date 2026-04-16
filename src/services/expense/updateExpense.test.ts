import { describe, it, expect, beforeEach } from 'vitest'
import { updateExpense } from './updateExpense'
import {
  matrixToExpenses,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('updateExpense', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('updates expense and linked transaction', async () => {
    resetAndSeedWorkbook({
      expenses: matrixWithRows('expenses', [
        {
          id: 'E1',
          date: '2025-01-01',
          category: 'other',
          amount: '10',
          notes: '',
        },
      ]),
      transactions: matrixWithRows('transactions', [
        {
          id: 'T1',
          date: '2025-01-01',
          type: 'expense',
          amount: '-10',
          category: 'other',
          concept: 'other',
          ref_type: 'expense',
          ref_id: 'E1',
          client_id: '',
          notes: '',
        },
      ]),
    })

    await updateExpense('s1', 'E1', {
      date: '2025-02-02',
      category: 'filament',
      amount: 20,
      notes: 'PLA',
    })

    const expenses = matrixToExpenses(useWorkbookStore.getState().tabs.expenses)
    const txs = matrixToTransactions(
      useWorkbookStore.getState().tabs.transactions,
    )
    expect(expenses[0]).toMatchObject({
      id: 'E1',
      date: '2025-02-02',
      category: 'filament',
      amount: 20,
      notes: 'PLA',
    })
    expect(txs[0]).toMatchObject({
      id: 'T1',
      date: '2025-02-02',
      type: 'expense',
      amount: -20,
      category: 'filament',
      concept: 'PLA',
      ref_type: 'expense',
      ref_id: 'E1',
      notes: 'PLA',
    })
  })

  it('uses category as concept when notes empty', async () => {
    resetAndSeedWorkbook({
      expenses: matrixWithRows('expenses', [
        {
          id: 'E1',
          date: '2025-01-01',
          category: 'other',
          amount: '10',
          notes: 'old',
        },
      ]),
      transactions: matrixWithRows('transactions', [
        {
          id: 'T1',
          date: '2025-01-01',
          type: 'expense',
          amount: '-10',
          category: 'other',
          concept: 'old',
          ref_type: 'expense',
          ref_id: 'E1',
          client_id: '',
          notes: 'old',
        },
      ]),
    })

    await updateExpense('s1', 'E1', {
      date: '2025-01-01',
      category: 'electric',
      amount: 15,
      notes: '',
    })

    const txs = matrixToTransactions(
      useWorkbookStore.getState().tabs.transactions,
    )
    expect(txs[0]).toMatchObject({
      concept: 'electric',
      category: 'electric',
      amount: -15,
    })
  })
})
