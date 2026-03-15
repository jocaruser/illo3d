import { getSheetsRepository } from './repository'
import type { Transaction } from '@/types/money'
import type { SheetName } from './config'

export async function fetchTransactions(
  spreadsheetId: string
): Promise<Transaction[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Transaction>(
    spreadsheetId,
    'transactions' as SheetName
  )
  return rows
    .filter((r) => r.id && r.date)
    .map((r) => ({
      ...r,
      amount: typeof r.amount === 'string' ? parseFloat(r.amount) : Number(r.amount),
    }))
    .sort((a, b) => (b.date > a.date ? 1 : -1))
}
