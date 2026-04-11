import { getSheetsRepository } from './repository'
import type { Inventory } from '@/types/money'
import type { SheetName } from './config'

function parseQty(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return Number(value)
}

export function formatInventoryCreatedDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toISOString().slice(0, 10)
}

export async function fetchInventory(
  spreadsheetId: string
): Promise<Inventory[]> {
  const repository = getSheetsRepository()
  const rows = await repository.readRows<Inventory>(
    spreadsheetId,
    'inventory' as SheetName
  )
  return rows
    .filter((r) => r.id && r.expense_id && r.created_at)
    .map((r) => ({
      ...r,
      qty_initial: parseQty(r.qty_initial),
      qty_current: parseQty(r.qty_current),
    }))
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}
