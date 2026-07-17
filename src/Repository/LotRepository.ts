import { Lot } from '@/Entity/Lot'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { AbstractSheetRepository } from './AbstractSheetRepository'

export class LotRepository extends AbstractSheetRepository<Lot> {
  protected readonly sheet = 'lots' as const
  protected readonly auditEntityName = 'lot' as const
  protected readonly idPrefix = 'L'

  protected hydrate(record: SheetRecord): Lot {
    return Lot.fromRecord(record)
  }

  findActiveByInventory(inventoryId: string): Lot[] {
    return this.findActive().filter((lot) => lot.inventoryId === inventoryId)
  }

  findActiveByTransaction(transactionId: string): Lot[] {
    return this.findActive().filter((lot) => lot.transactionId === transactionId)
  }
}
