import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import {
  matrixToExpenses,
  matrixToInventory,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { nextNumericId } from '@/utils/id'
import { useWorkbookStore } from '@/stores/workbookStore'
import type { ExpenseCategory, InventoryType } from '@/types/money'

export interface CreateExpensePayload {
  date: string
  category: ExpenseCategory
  amount: number
  notes?: string
  inventory?: {
    type: InventoryType
    name: string
    quantity: number
  }
}

export async function createExpense(
  spreadsheetId: string,
  payload: CreateExpensePayload
): Promise<void> {
  void spreadsheetId
  const tabs = useWorkbookStore.getState().tabs
  const expenses = matrixToExpenses(tabs.expenses)
  const transactions = matrixToTransactions(tabs.transactions)
  const expenseId = nextNumericId(
    'E',
    expenses.map((e) => e.id).filter((id): id is string => id != null),
  )
  const transactionId = nextNumericId(
    'T',
    transactions.map((t) => t.id).filter((id): id is string => id != null),
  )

  let inventoryId: string | undefined
  if (payload.inventory) {
    const inventoryRows = matrixToInventory(tabs.inventory)
    inventoryId = nextNumericId(
      'INV',
      inventoryRows.map((r) => r.id).filter((id): id is string => id != null),
    )
  }

  const expenseRow = {
    id: expenseId,
    date: payload.date,
    category: payload.category,
    amount: payload.amount,
    notes: payload.notes ?? '',
    archived: '',
    deleted: '',
  }

  const transactionRow = {
    id: transactionId,
    date: payload.date,
    type: 'expense',
    amount: -payload.amount,
    category: payload.category,
    concept: payload.notes ?? payload.category,
    ref_type: 'expense',
    ref_id: expenseId,
    client_id: '',
    notes: payload.notes ?? '',
    archived: '',
    deleted: '',
  }

  patchWorkbookTab('expenses', (m) =>
    appendDataRow('expenses', m, expenseRow),
  )
  patchWorkbookTab('transactions', (m) =>
    appendDataRow('transactions', m, transactionRow),
  )

  if (payload.inventory && inventoryId) {
    const inv = payload.inventory
    patchWorkbookTab('inventory', (m) =>
      appendDataRow('inventory', m, {
        id: inventoryId,
        expense_id: expenseId,
        type: inv.type,
        name: inv.name,
        qty_initial: inv.quantity,
        qty_current: inv.quantity,
        created_at: new Date().toISOString(),
        archived: '',
        deleted: '',
      }),
    )
  }
}
