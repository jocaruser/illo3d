import { describe, it, expect, beforeEach } from 'vitest'
import { createExpense } from './createExpense'
import {
  matrixToExpenses,
  matrixToInventory,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('createExpense', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('appends expense and transaction rows with E1 and T1 ids', async () => {
    resetAndSeedWorkbook({})

    await createExpense('spreadsheet-1', {
      date: '2025-01-20',
      category: 'electric',
      amount: 75.5,
      notes: 'Monthly bill',
    })

    const expenses = matrixToExpenses(useWorkbookStore.getState().tabs.expenses)
    const txs = matrixToTransactions(
      useWorkbookStore.getState().tabs.transactions,
    )
    expect(expenses).toHaveLength(1)
    expect(expenses[0]).toMatchObject({
      id: 'E1',
      date: '2025-01-20',
      category: 'electric',
      amount: 75.5,
      notes: 'Monthly bill',
    })
    expect(txs).toHaveLength(1)
    expect(txs[0]).toMatchObject({
      id: 'T1',
      date: '2025-01-20',
      type: 'expense',
      amount: -75.5,
      category: 'electric',
      concept: 'Monthly bill',
      ref_type: 'expense',
      ref_id: 'E1',
    })
  })

  it('increments ids when expenses and transactions exist', async () => {
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
      transactions: matrixWithRows('transactions', [
        {
          id: 'T1',
          date: '2025-01-01',
          type: 'expense',
          amount: '-1',
          category: 'x',
          concept: 'x',
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
          category: 'x',
          concept: 'x',
          ref_type: 'expense',
          ref_id: 'E2',
          client_id: '',
          notes: '',
        },
      ]),
    })

    await createExpense('spreadsheet-1', {
      date: '2025-01-21',
      category: 'maintenance',
      amount: 30,
    })

    const expenses = matrixToExpenses(useWorkbookStore.getState().tabs.expenses)
    const txs = matrixToTransactions(
      useWorkbookStore.getState().tabs.transactions,
    )
    expect(expenses.find((e) => e.id === 'E3')).toMatchObject({
      category: 'maintenance',
      amount: 30,
    })
    expect(txs.find((t) => t.id === 'T3')).toMatchObject({
      ref_id: 'E3',
      concept: 'maintenance',
    })
  })

  it('does not append inventory when inventory is omitted', async () => {
    resetAndSeedWorkbook({})

    await createExpense('spreadsheet-1', {
      date: '2025-01-22',
      category: 'electric',
      amount: 10,
    })

    expect(
      matrixToInventory(useWorkbookStore.getState().tabs.inventory),
    ).toHaveLength(0)
    expect(matrixToExpenses(useWorkbookStore.getState().tabs.expenses)).toHaveLength(1)
    expect(
      matrixToTransactions(useWorkbookStore.getState().tabs.transactions),
    ).toHaveLength(1)
  })

  it('appends inventory row when inventory payload is provided (filament)', async () => {
    resetAndSeedWorkbook({})

    await createExpense('spreadsheet-1', {
      date: '2025-01-23',
      category: 'filament',
      amount: 29.99,
      notes: 'PLA White',
      inventory: { type: 'filament', name: 'PLA White', quantity: 1000 },
    })

    const inv = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    expect(inv).toHaveLength(1)
    expect(inv[0]).toMatchObject({
      id: 'INV1',
      expense_id: 'E1',
      type: 'filament',
      name: 'PLA White',
      qty_initial: 1000,
      qty_current: 1000,
    })
    expect(inv[0].created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('appends inventory row for equipment type', async () => {
    resetAndSeedWorkbook({
      expenses: matrixWithRows('expenses', [
        {
          id: 'E1',
          date: '2025-01-01',
          category: 'other',
          amount: '1',
          notes: '',
        },
      ]),
      transactions: matrixWithRows('transactions', [
        {
          id: 'T1',
          date: '2025-01-01',
          type: 'expense',
          amount: '-1',
          category: 'x',
          concept: 'x',
          ref_type: 'expense',
          ref_id: 'E1',
          client_id: '',
          notes: '',
        },
      ]),
      inventory: matrixWithRows('inventory', [
        {
          id: 'INV1',
          expense_id: 'E1',
          type: 'filament',
          name: 'x',
          qty_initial: '1',
          qty_current: '1',
          created_at: '2025-01-01T00:00:00.000Z',
        },
      ]),
    })

    await createExpense('spreadsheet-1', {
      date: '2025-01-24',
      category: 'investment',
      amount: 350,
      notes: 'Ender 3',
      inventory: { type: 'equipment', name: 'Ender 3', quantity: 1 },
    })

    const inv = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    const last = inv.find((r) => r.id === 'INV2')
    expect(last).toMatchObject({
      id: 'INV2',
      expense_id: 'E2',
      type: 'equipment',
      name: 'Ender 3',
      qty_initial: 1,
      qty_current: 1,
    })
  })
})
