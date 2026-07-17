import { SheetEntity, numericCell, parseNumericCell, type SheetRecord } from './SheetEntity'

/** A bill-of-materials line linking a piece to an inventory item. */
export class PieceItem extends SheetEntity {
  id = ''
  pieceId = ''
  inventoryId = ''
  /** Quantity consumed per single unit of the piece. */
  quantity: number | undefined = undefined

  static fromRecord(record: SheetRecord): PieceItem {
    const item = new PieceItem()
    item.id = record.id ?? ''
    item.pieceId = record.piece_id ?? ''
    item.inventoryId = record.inventory_id ?? ''
    item.quantity = parseNumericCell(record.quantity ?? '')
    item.archived = record.archived ?? ''
    item.deleted = record.deleted ?? ''
    return item
  }

  toRecord(): SheetRecord {
    return {
      id: this.id,
      piece_id: this.pieceId,
      inventory_id: this.inventoryId,
      quantity: numericCell(this.quantity),
      archived: this.archived,
      deleted: this.deleted,
    }
  }
}
