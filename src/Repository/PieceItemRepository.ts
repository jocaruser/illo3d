import { PieceItem } from '@/Entity/PieceItem'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { AbstractSheetRepository } from './AbstractSheetRepository'

export class PieceItemRepository extends AbstractSheetRepository<PieceItem> {
  protected readonly sheet = 'piece_items' as const
  protected readonly auditEntityName = 'piece_item' as const
  protected readonly idPrefix = 'PI'

  protected hydrate(record: SheetRecord): PieceItem {
    return PieceItem.fromRecord(record)
  }

  findActiveByPiece(pieceId: string): PieceItem[] {
    return this.findActive().filter((item) => item.pieceId === pieceId)
  }

  findByPiece(pieceId: string): PieceItem[] {
    return this.findAll().filter((item) => item.pieceId === pieceId)
  }

  findActiveByInventory(inventoryId: string): PieceItem[] {
    return this.findActive().filter((item) => item.inventoryId === inventoryId)
  }

  /** An active line already exists for this piece + inventory pair. */
  hasActiveLine(pieceId: string, inventoryId: string): boolean {
    return this.findActiveByPiece(pieceId).some((item) => item.inventoryId === inventoryId)
  }
}
