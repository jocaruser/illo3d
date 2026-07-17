import { SheetEntity, numericCell, parseNumericCell, type SheetRecord } from './SheetEntity'

/** A purchase batch: quantity of an inventory item bought in one transaction. */
export class Lot extends SheetEntity {
  id = ''
  inventoryId = ''
  transactionId = ''
  quantity: number | undefined = undefined
  /** Cost of the lot (non-negative). */
  amount: number | undefined = undefined
  createdAt = ''

  static fromRecord(record: SheetRecord): Lot {
    const lot = new Lot()
    lot.id = record.id ?? ''
    lot.inventoryId = record.inventory_id ?? ''
    lot.transactionId = record.transaction_id ?? ''
    lot.quantity = parseNumericCell(record.quantity ?? '')
    lot.amount = parseNumericCell(record.amount ?? '')
    lot.createdAt = record.created_at ?? ''
    lot.archived = record.archived ?? ''
    lot.deleted = record.deleted ?? ''
    return lot
  }

  toRecord(): SheetRecord {
    return {
      id: this.id,
      inventory_id: this.inventoryId,
      transaction_id: this.transactionId,
      quantity: numericCell(this.quantity),
      amount: numericCell(this.amount),
      created_at: this.createdAt,
      archived: this.archived,
      deleted: this.deleted,
    }
  }
}
