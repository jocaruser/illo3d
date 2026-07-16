import { InventoryItem } from '@/Entity/InventoryItem'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { AbstractSheetRepository } from './AbstractSheetRepository'

export class InventoryRepository extends AbstractSheetRepository<InventoryItem> {
  protected readonly sheet = 'inventory' as const
  protected readonly auditEntityName = 'inventory' as const
  protected readonly idPrefix = 'INV'

  protected hydrate(record: SheetRecord): InventoryItem {
    return InventoryItem.fromRecord(record)
  }
}
