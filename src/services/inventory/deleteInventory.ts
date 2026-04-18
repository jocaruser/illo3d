import { archiveInventory } from '@/services/lifecycle/lifecycle'

export async function deleteInventory(
  spreadsheetId: string,
  inventoryId: string,
): Promise<void> {
  void spreadsheetId
  archiveInventory(inventoryId)
}
