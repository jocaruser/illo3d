import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToInventory } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'

function clampQtyCurrent(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.floor(n)
}

export async function updateInventoryQtyCurrent(
  spreadsheetId: string,
  inventoryId: string,
  qtyCurrent: number,
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
    qty_current: clampQtyCurrent(qtyCurrent),
    warn_yellow: existing.warn_yellow,
    warn_orange: existing.warn_orange,
    warn_red: existing.warn_red,
    created_at: existing.created_at,
    archived: existing.archived ?? '',
    deleted: existing.deleted ?? '',
  }

  patchWorkbookTab('inventory', (m) =>
    updateDataRowById('inventory', m, inventoryId, row),
  )
}
