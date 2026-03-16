import { getSheetsRepository } from './repository'
import type { Expense } from '@/types/money'
import type { SheetName } from './config'

export async function fetchExpenses(
  spreadsheetId: string
): Promise<Expense[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Expense>(
    spreadsheetId,
    'expenses' as SheetName
  )
  return rows
    .filter((r) => r.id && r.date)
    .map((r) => ({
      ...r,
      amount: typeof r.amount === 'string' ? parseFloat(r.amount) : Number(r.amount),
    }))
    .sort((a, b) => (b.date > a.date ? 1 : -1))
}
