import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import {
  matrixToExpenses,
  matrixToInventory,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

export async function deleteExpense(
  spreadsheetId: string,
  expenseId: string
): Promise<void> {
  void spreadsheetId
  const tabs = useWorkbookStore.getState().tabs
  const expenses = matrixToExpenses(tabs.expenses)
  const exp = expenses.find((e) => e.id === expenseId)
  if (!exp) {
    throw new Error(`Expense ${expenseId} not found`)
  }

  patchWorkbookTab('expenses', (m) =>
    updateDataRowById('expenses', m, expenseId, {
      id: exp.id,
      date: exp.date,
      category: exp.category,
      amount: exp.amount,
      notes: exp.notes ?? '',
      archived: 'true',
      deleted: exp.deleted ?? '',
    }),
  )

  const transactions = matrixToTransactions(
    useWorkbookStore.getState().tabs.transactions,
  )
  for (const tx of transactions) {
    if (tx.ref_type === 'expense' && tx.ref_id === expenseId) {
      const tid = tx.id
      patchWorkbookTab('transactions', (m) =>
        updateDataRowById('transactions', m, tid, {
          id: tx.id,
          date: tx.date,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          concept: tx.concept,
          ref_type: tx.ref_type,
          ref_id: tx.ref_id,
          client_id: tx.client_id ?? '',
          notes: tx.notes ?? '',
          archived: 'true',
          deleted: tx.deleted ?? '',
        }),
      )
    }
  }

  const inventory = matrixToInventory(
    useWorkbookStore.getState().tabs.inventory,
  )
  const inv = inventory.find((i) => i.expense_id === expenseId)
  if (inv) {
    patchWorkbookTab('inventory', (m) =>
      updateDataRowById('inventory', m, inv.id, {
        id: inv.id,
        expense_id: inv.expense_id,
        type: inv.type,
        name: inv.name,
        qty_initial: inv.qty_initial,
        qty_current: inv.qty_current,
        created_at: inv.created_at,
        archived: 'true',
        deleted: inv.deleted ?? '',
      }),
    )
  }
}
