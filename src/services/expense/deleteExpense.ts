import { getSheetsRepository } from '@/services/sheets/repository'
import type { SheetName } from '@/services/sheets/config'
import type { Expense, Inventory, Transaction } from '@/types/money'

export async function deleteExpense(
  spreadsheetId: string,
  expenseId: string
): Promise<void> {
  const repo = getSheetsRepository()
  const expenses = await repo.readRows<Expense>(
    spreadsheetId,
    'expenses' as SheetName
  )
  const inventory = await repo.readRows<Inventory>(
    spreadsheetId,
    'inventory' as SheetName
  )
  const transactions = await repo.readRows<Transaction>(
    spreadsheetId,
    'transactions' as SheetName
  )

  const expenseIdx = expenses.findIndex((e) => e.id === expenseId)
  if (expenseIdx === -1) {
    throw new Error(`Expense ${expenseId} not found`)
  }

  const txIndices: number[] = []
  transactions.forEach((t, i) => {
    if (t.ref_type === 'expense' && t.ref_id === expenseId) {
      txIndices.push(i)
    }
  })
  const invIdx = inventory.findIndex((inv) => inv.expense_id === expenseId)

  if (invIdx !== -1) {
    await repo.deleteRow(
      spreadsheetId,
      'inventory' as SheetName,
      invIdx + 1
    )
  }

  for (const ti of [...txIndices].sort((a, b) => b - a)) {
    await repo.deleteRow(
      spreadsheetId,
      'transactions' as SheetName,
      ti + 1
    )
  }

  await repo.deleteRow(
    spreadsheetId,
    'expenses' as SheetName,
    expenseIdx + 1
  )
}
