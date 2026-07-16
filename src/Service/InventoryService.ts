import type { InventoryItem } from '@/Entity/InventoryItem'
import type { Lot } from '@/Entity/Lot'
import type { Transaction } from '@/Entity/Transaction'
import type { EntityManager } from '@/Repository/EntityManager'

export interface ThresholdsInput {
  yellow: number
  orange: number
  red: number
}

export interface LotFieldsInput {
  quantity: number
  amount: number
}

export type InventoryResult = { ok: true; item: InventoryItem } | { ok: false; error: string }

export type LotResult = { ok: true; lot: Lot } | { ok: false; error: string }

export type TransactionResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; error: string }

const COLOUR_PATTERN = /^#[0-9a-fA-F]{6}$/

export class InventoryService {
  constructor(private readonly em: EntityManager) {}

  updateQtyCurrent(id: string, value: number): InventoryResult {
    const item = this.em.inventory.find(id)
    if (item === null) return { ok: false, error: 'inventoryDetail.notFound' }
    if (!Number.isFinite(value) || value < 0) {
      return { ok: false, error: 'inventoryDetail.qtyInvalid' }
    }
    item.qtyCurrent = Math.round(value * 100) / 100
    this.em.inventory.save(item)
    return { ok: true, item }
  }

  updateThresholds(id: string, thresholds: ThresholdsInput): InventoryResult {
    const item = this.em.inventory.find(id)
    if (item === null) return { ok: false, error: 'inventoryDetail.notFound' }
    for (const value of [thresholds.yellow, thresholds.orange, thresholds.red]) {
      if (!Number.isInteger(value) || value < 0) {
        return { ok: false, error: 'inventoryDetail.saveError' }
      }
    }
    item.warnYellow = thresholds.yellow
    item.warnOrange = thresholds.orange
    item.warnRed = thresholds.red
    this.em.inventory.save(item)
    return { ok: true, item }
  }

  /** `#RRGGBB`, or '' to clear the swatch. */
  updateColour(id: string, colour: string): InventoryResult {
    const item = this.em.inventory.find(id)
    if (item === null) return { ok: false, error: 'inventoryDetail.notFound' }
    if (colour !== '' && !COLOUR_PATTERN.test(colour)) {
      return { ok: false, error: 'errors.actionFailed' }
    }
    item.colour = colour
    this.em.inventory.save(item)
    return { ok: true, item }
  }

  updateLot(lotId: string, fields: LotFieldsInput): LotResult {
    const lot = this.em.lots.find(lotId)
    if (lot === null) return { ok: false, error: 'errors.actionFailed' }
    if (!Number.isFinite(fields.quantity) || fields.quantity <= 0) {
      return { ok: false, error: 'inventoryDetail.lotQuantityInvalid' }
    }
    if (!Number.isFinite(fields.amount) || fields.amount < 0) {
      return { ok: false, error: 'inventoryDetail.lotAmountInvalid' }
    }
    lot.quantity = fields.quantity
    lot.amount = fields.amount
    this.em.lots.save(lot)
    return { ok: true, lot }
  }

  /** Expense edit from the transaction detail page: amount stays negative. */
  updateTransactionAmount(transactionId: string, amount: number): TransactionResult {
    const transaction = this.em.transactions.find(transactionId)
    if (transaction === null || !transaction.isExpense()) {
      return { ok: false, error: 'expenseTransactionDetail.notFound' }
    }
    if (!Number.isFinite(amount) || amount >= 0) {
      return { ok: false, error: 'expenseTransactionDetail.amountInvalid' }
    }
    transaction.amount = amount
    this.em.transactions.save(transaction)
    return { ok: true, transaction }
  }
}
