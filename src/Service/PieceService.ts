import { Piece, type PieceStatus } from '@/Entity/Piece'
import { PieceItem } from '@/Entity/PieceItem'
import type { EntityManager } from '@/Repository/EntityManager'
import { isoInstant } from './Clock'

export interface CreatePieceInput {
  jobId: string
  name: string
  price?: number
}

export interface UpdatePieceInput {
  name: string
  price?: number
  units?: number
}

export interface CreatePieceItemInput {
  pieceId: string
  inventoryId: string
  quantity: number
}

export interface UpdatePieceStatusOptions {
  decrementInventory?: boolean
  restoreInventory?: boolean
}

export interface InsufficientStockLine {
  inventoryId: string
  name: string
  have: number
  need: number
}

export type PieceResult = { ok: true; piece: Piece } | { ok: false; error: string }

export type PieceItemResult = { ok: true; item: PieceItem } | { ok: false; error: string }

export type PieceStatusResult =
  | { ok: true; piece: Piece }
  | { ok: false; error: string; insufficient?: InsufficientStockLine[] }

/** Round inventory quantities to 2 decimals, floored at 0. */
function roundQty(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.round(value * 100) / 100
}

function priceIsInvalid(price: number | undefined): boolean {
  return price !== undefined && (!Number.isFinite(price) || price < 0)
}

function unitsAreInvalid(units: number | undefined): boolean {
  return units !== undefined && (!Number.isInteger(units) || units <= 0)
}

export class PieceService {
  constructor(private readonly em: EntityManager) {}

  createPiece(input: CreatePieceInput): PieceResult {
    if (input.jobId.trim() === '') return { ok: false, error: 'pieces.validation.jobRequired' }
    if (input.name.trim() === '') return { ok: false, error: 'pieces.validation.nameRequired' }
    if (priceIsInvalid(input.price)) return { ok: false, error: 'jobs.validation.priceInvalid' }
    const piece = new Piece()
    piece.id = this.em.pieces.nextId()
    piece.jobId = input.jobId
    piece.name = input.name.trim()
    piece.status = 'pending'
    piece.price = input.price
    piece.createdAt = isoInstant(this.em.clock)
    this.em.pieces.save(piece)
    return { ok: true, piece }
  }

  updatePiece(id: string, input: UpdatePieceInput): PieceResult {
    const piece = this.em.pieces.find(id)
    if (piece === null) return { ok: false, error: 'errors.actionFailed' }
    if (input.name.trim() === '') return { ok: false, error: 'pieces.validation.nameRequired' }
    if (priceIsInvalid(input.price)) return { ok: false, error: 'jobs.validation.priceInvalid' }
    if (unitsAreInvalid(input.units)) return { ok: false, error: 'pieces.statusNeedsUnits' }
    piece.name = input.name.trim()
    piece.price = input.price
    piece.units = input.units
    this.em.pieces.save(piece)
    return { ok: true, piece }
  }

  createPieceItem(input: CreatePieceItemInput): PieceItemResult {
    if (input.inventoryId.trim() === '') {
      return { ok: false, error: 'pieces.validation.inventoryRequired' }
    }
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      return { ok: false, error: 'pieces.validation.quantityPositive' }
    }
    if (this.em.pieceItems.hasActiveLine(input.pieceId, input.inventoryId)) {
      return { ok: false, error: 'pieces.validation.duplicateInventory' }
    }
    const item = new PieceItem()
    item.id = this.em.pieceItems.nextId()
    item.pieceId = input.pieceId
    item.inventoryId = input.inventoryId
    item.quantity = input.quantity
    this.em.pieceItems.save(item)
    return { ok: true, item }
  }

  /** Soft delete: the repository audits the lifecycle flip as a `delete`. */
  deletePieceItem(id: string): PieceItemResult {
    const item = this.em.pieceItems.find(id)
    if (item === null) return { ok: false, error: 'errors.actionFailed' }
    item.deleted = 'true'
    this.em.pieceItems.save(item)
    return { ok: true, item }
  }

  /**
   * Move a piece between pending and done/failed. Entering a consuming status
   * requires at least one active material line and valid units; with
   * `decrementInventory` the effective need (line qty × units) is checked and
   * subtracted per inventory item, and `restoreInventory` adds it back when
   * reverting to pending.
   */
  updatePieceStatus(
    piece: Piece,
    newStatus: PieceStatus,
    options?: UpdatePieceStatusOptions,
  ): PieceStatusResult {
    const current = this.em.pieces.find(piece.id)
    if (current === null) return { ok: false, error: 'errors.actionFailed' }

    const wasConsuming = current.isConsuming()
    const willConsume = newStatus === 'done' || newStatus === 'failed'
    const lines = this.em.pieceItems.findActiveByPiece(current.id)

    if (!wasConsuming && willConsume) {
      if (lines.length === 0) return { ok: false, error: 'pieces.statusNeedsLines' }
      if (!current.hasValidUnits()) return { ok: false, error: 'pieces.statusNeedsUnits' }

      if (options?.decrementInventory === true) {
        const need = this.effectiveNeedByInventory(current, lines)
        const insufficient = this.findInsufficient(need)
        if (insufficient.length > 0) {
          return { ok: false, error: 'pieces.statusInsufficientStockDetail', insufficient }
        }
        this.adjustInventory(need, -1)
      }
    }

    if (wasConsuming && !willConsume && options?.restoreInventory === true) {
      this.adjustInventory(this.effectiveNeedByInventory(current, lines), 1)
    }

    current.status = newStatus
    this.em.pieces.save(current)
    return { ok: true, piece: current }
  }

  /** Σ(line quantity × units) per inventory id. */
  private effectiveNeedByInventory(piece: Piece, lines: PieceItem[]): Map<string, number> {
    const units = piece.units as number
    const need = new Map<string, number>()
    for (const line of lines) {
      if (line.quantity === undefined) continue
      need.set(line.inventoryId, (need.get(line.inventoryId) ?? 0) + line.quantity * units)
    }
    return need
  }

  private findInsufficient(need: Map<string, number>): InsufficientStockLine[] {
    const insufficient: InsufficientStockLine[] = []
    for (const [inventoryId, required] of need) {
      const item = this.em.inventory.find(inventoryId)
      const have = item?.qtyCurrent ?? 0
      if (have < required) {
        insufficient.push({ inventoryId, name: item?.name ?? inventoryId, have, need: required })
      }
    }
    return insufficient
  }

  private adjustInventory(need: Map<string, number>, direction: 1 | -1): void {
    for (const [inventoryId, amount] of need) {
      const item = this.em.inventory.find(inventoryId)
      if (item === null) continue
      item.qtyCurrent = roundQty(item.qtyCurrent + direction * amount)
      this.em.inventory.save(item)
    }
  }
}
