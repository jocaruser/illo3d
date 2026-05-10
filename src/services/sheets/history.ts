import { getSheetsRepository } from './repository'
import type { History } from '@/types/money'
import type { SheetName } from './config'

export async function fetchHistory(spreadsheetId: string): Promise<History[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<History>(
    spreadsheetId,
    'history' as SheetName
  )
  return rows
    .filter((r) => r.id)
    .sort((a, b) => (b.changed_at > a.changed_at ? 1 : -1))
}