import { SheetEntity, numericCell, parseNumericCell, type SheetRecord } from './SheetEntity'

export const INVENTORY_TYPES = ['filament', 'consumable', 'equipment'] as const

export type InventoryType = (typeof INVENTORY_TYPES)[number]

export function parseInventoryType(value: string): InventoryType {
  return (INVENTORY_TYPES as readonly string[]).includes(value)
    ? (value as InventoryType)
    : 'consumable'
}

export type StockAlertLevel = 'red' | 'orange' | 'yellow' | null

export class InventoryItem extends SheetEntity {
  id = ''
  type: InventoryType = 'consumable'
  name = ''
  qtyCurrent = 0
  /** Thresholds: 0 disables the tier. Precedence red > orange > yellow. */
  warnYellow = 0
  warnOrange = 0
  warnRed = 0
  createdAt = ''
  /** v3: optional `#RRGGBB` swatch colour (filament spools). */
  colour = ''

  stockAlertLevel(): StockAlertLevel {
    if (this.warnRed > 0 && this.qtyCurrent <= this.warnRed) return 'red'
    if (this.warnOrange > 0 && this.qtyCurrent <= this.warnOrange) return 'orange'
    if (this.warnYellow > 0 && this.qtyCurrent <= this.warnYellow) return 'yellow'
    return null
  }

  static fromRecord(record: SheetRecord): InventoryItem {
    const item = new InventoryItem()
    item.id = record.id ?? ''
    item.type = parseInventoryType(record.type ?? '')
    item.name = record.name ?? ''
    item.qtyCurrent = parseNumericCell(record.qty_current ?? '') ?? 0
    item.warnYellow = parseNumericCell(record.warn_yellow ?? '') ?? 0
    item.warnOrange = parseNumericCell(record.warn_orange ?? '') ?? 0
    item.warnRed = parseNumericCell(record.warn_red ?? '') ?? 0
    item.createdAt = record.created_at ?? ''
    item.colour = record.colour ?? ''
    item.archived = record.archived ?? ''
    item.deleted = record.deleted ?? ''
    return item
  }

  toRecord(): SheetRecord {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      qty_current: numericCell(this.qtyCurrent),
      warn_yellow: numericCell(this.warnYellow),
      warn_orange: numericCell(this.warnOrange),
      warn_red: numericCell(this.warnRed),
      created_at: this.createdAt,
      archived: this.archived,
      deleted: this.deleted,
      colour: this.colour,
    }
  }
}
