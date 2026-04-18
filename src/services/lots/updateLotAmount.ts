import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToLots } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

export function parseLotPurchaseAmountInput(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (trimmed === '') return null
  const n = parseFloat(trimmed)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function parseLotQuantityInput(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (trimmed === '') return null
  const n = parseFloat(trimmed)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export async function updateLotFields(
  spreadsheetId: string,
  lotId: string,
  fields: { quantity: number; amount: number },
): Promise<void> {
  void spreadsheetId
  const lots = matrixToLots(useWorkbookStore.getState().tabs.lots)
  const existing = lots.find((l) => l.id === lotId)
  if (!existing) {
    throw new Error(`Lot ${lotId} not found`)
  }
  if (!Number.isFinite(fields.quantity) || fields.quantity <= 0) {
    throw new Error('Lot quantity must be a positive number')
  }
  if (!Number.isFinite(fields.amount) || fields.amount <= 0) {
    throw new Error('Lot amount must be a positive number')
  }

  const row: Record<string, unknown> = {
    id: existing.id,
    inventory_id: existing.inventory_id,
    transaction_id: existing.transaction_id,
    quantity: fields.quantity,
    amount: fields.amount,
    created_at: existing.created_at,
    archived: existing.archived ?? '',
    deleted: existing.deleted ?? '',
  }

  patchWorkbookTab('lots', (m) => updateDataRowById('lots', m, lotId, row))
}
