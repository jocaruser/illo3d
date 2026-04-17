import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToInventory } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

export interface UpdateInventoryThresholdsPayload {
  warn_yellow: number
  warn_orange: number
  warn_red: number
}

function clampNonNegative(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

export async function updateInventoryThresholds(
  spreadsheetId: string,
  inventoryId: string,
  payload: UpdateInventoryThresholdsPayload
): Promise<void> {
  void spreadsheetId
  const inventory = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
  const existing = inventory.find((i) => i.id === inventoryId)
  if (!existing) {
    throw new Error(`Inventory ${inventoryId} not found`)
  }
  const row: Record<string, unknown> = {
    id: existing.id,
    type: existing.type,
    name: existing.name,
    qty_current: existing.qty_current,
    warn_yellow: clampNonNegative(payload.warn_yellow),
    warn_orange: clampNonNegative(payload.warn_orange),
    warn_red: clampNonNegative(payload.warn_red),
    created_at: existing.created_at,
    archived: existing.archived ?? '',
    deleted: existing.deleted ?? '',
  }

  patchWorkbookTab('inventory', (m) =>
    updateDataRowById('inventory', m, inventoryId, row),
  )
}
