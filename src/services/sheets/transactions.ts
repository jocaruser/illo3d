import { readSheetRows } from './read'
import type { Transaction } from '@/types/money'
import type { SheetName } from './config'

export async function fetchTransactions(
  spreadsheetId: string,
  getAccessToken: () => Promise<string>
): Promise<Transaction[]> {
  const accessToken = await getAccessToken()
  const rows = await readSheetRows<Transaction>(
    spreadsheetId,
    'transactions' as SheetName,
    accessToken
  )
  return rows
    .filter((r) => r.id && r.date)
    .map((r) => ({
      ...r,
      amount: typeof r.amount === 'string' ? parseFloat(r.amount) : Number(r.amount),
    }))
    .sort((a, b) => (b.date > a.date ? 1 : -1))
}
