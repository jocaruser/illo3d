import { SheetEntity, numericCell, parseNumericCell, type SheetRecord } from './SheetEntity'

export const PIECE_STATUSES = ['pending', 'done', 'failed'] as const

export type PieceStatus = (typeof PIECE_STATUSES)[number]

export function parsePieceStatus(value: string): PieceStatus {
  return (PIECE_STATUSES as readonly string[]).includes(value) ? (value as PieceStatus) : 'pending'
}

export class Piece extends SheetEntity {
  id = ''
  jobId = ''
  name = ''
  status: PieceStatus = 'pending'
  /** Per-unit price. */
  price: number | undefined = undefined
  /** Positive integer; unset pieces are excluded from pricing and consumption. */
  units: number | undefined = undefined
  createdAt = ''

  /** done/failed pieces consume inventory. */
  isConsuming(): boolean {
    return this.status === 'done' || this.status === 'failed'
  }

  hasValidUnits(): boolean {
    return this.units !== undefined && Number.isInteger(this.units) && this.units > 0
  }

  /** Priced = price set (0 allowed) and units valid; required before a job can be paid. */
  isPriced(): boolean {
    return this.price !== undefined && this.hasValidUnits()
  }

  lineTotal(): number | undefined {
    if (!this.isPriced()) return undefined
    return (this.price as number) * (this.units as number)
  }

  static fromRecord(record: SheetRecord): Piece {
    const piece = new Piece()
    piece.id = record.id ?? ''
    piece.jobId = record.job_id ?? ''
    piece.name = record.name ?? ''
    piece.status = parsePieceStatus(record.status ?? '')
    piece.price = parseNumericCell(record.price ?? '')
    piece.units = parseNumericCell(record.units ?? '')
    piece.createdAt = record.created_at ?? ''
    piece.archived = record.archived ?? ''
    piece.deleted = record.deleted ?? ''
    return piece
  }

  toRecord(): SheetRecord {
    return {
      id: this.id,
      job_id: this.jobId,
      name: this.name,
      status: this.status,
      price: numericCell(this.price),
      units: numericCell(this.units),
      created_at: this.createdAt,
      archived: this.archived,
      deleted: this.deleted,
    }
  }
}
