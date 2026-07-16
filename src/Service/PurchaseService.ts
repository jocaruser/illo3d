import { InventoryItem, type InventoryType } from '@/Entity/InventoryItem'
import { Lot } from '@/Entity/Lot'
import {
  EXPENSE_CATEGORIES,
  Transaction,
  type ExpenseCategory,
} from '@/Entity/Transaction'
import type { EntityManager } from '@/Repository/EntityManager'
import { isoDay, isoInstant } from './Clock'

export type PurchaseLineInput =
  | { mode: 'existing'; inventoryId: string; quantity: number; amount: number }
  | { mode: 'new'; name: string; type: InventoryType; quantity: number; amount: number }

export interface RecordPurchaseInput {
  category: ExpenseCategory
  /** `YYYY-MM-DD`; today (via the clock) when omitted. */
  date?: string
  notes?: string
  addToInventory: boolean
  /** Overhead purchases only: positive total. Inventory purchases derive it from lines. */
  amount?: number
  lines?: PurchaseLineInput[]
}

export type PurchaseResult =
  | { ok: true; transaction: Transaction }
  | { ok: false; error: string }

/** Categories allowed when a purchase also adds inventory. */
export const INVENTORY_PURCHASE_CATEGORIES = ['filament', 'consumable', 'equipment'] as const

export class PurchaseService {
  constructor(private readonly em: EntityManager) {}

  recordPurchase(input: RecordPurchaseInput): PurchaseResult {
    if (!(EXPENSE_CATEGORIES as readonly string[]).includes(input.category)) {
      return { ok: false, error: 'purchase.validation.required' }
    }

    if (!input.addToInventory) {
      const amount = input.amount
      if (amount === undefined || !Number.isFinite(amount) || amount <= 0) {
        return { ok: false, error: 'purchase.validation.amountPositive' }
      }
      return { ok: true, transaction: this.appendTransaction(input, amount) }
    }

    if (!(INVENTORY_PURCHASE_CATEGORIES as readonly string[]).includes(input.category)) {
      return { ok: false, error: 'purchase.validation.required' }
    }
    const lines = input.lines ?? []
    if (lines.length === 0) return { ok: false, error: 'purchase.validation.lineRequired' }
    for (const line of lines) {
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
        return { ok: false, error: 'purchase.validation.quantityPositive' }
      }
      if (!Number.isFinite(line.amount) || line.amount <= 0) {
        return { ok: false, error: 'purchase.validation.amountPositive' }
      }
      if (line.mode === 'new' && line.name.trim() === '') {
        return { ok: false, error: 'purchase.validation.inventoryNameRequired' }
      }
      if (line.mode === 'existing' && this.em.inventory.find(line.inventoryId) === null) {
        return { ok: false, error: 'inventoryDetail.notFound' }
      }
    }

    const total = lines.reduce((sum, line) => sum + line.amount, 0)
    const transaction = this.appendTransaction(input, total)
    for (const line of lines) {
      this.appendLine(line, transaction.id)
    }
    return { ok: true, transaction }
  }

  private appendTransaction(input: RecordPurchaseInput, total: number): Transaction {
    const notes = input.notes?.trim() ?? ''
    const transaction = new Transaction()
    transaction.id = this.em.transactions.nextId()
    transaction.date = input.date ?? isoDay(this.em.clock)
    transaction.type = 'expense'
    transaction.amount = -Math.abs(total)
    transaction.category = input.category
    transaction.concept = notes !== '' ? notes : input.category
    transaction.notes = notes
    this.em.transactions.save(transaction)
    return transaction
  }

  private appendLine(line: PurchaseLineInput, transactionId: string): void {
    let inventoryId: string
    if (line.mode === 'new') {
      const item = new InventoryItem()
      item.id = this.em.inventory.nextId()
      item.type = line.type
      item.name = line.name.trim()
      item.qtyCurrent = line.quantity
      item.createdAt = isoInstant(this.em.clock)
      this.em.inventory.save(item)
      inventoryId = item.id
    } else {
      const item = this.em.inventory.find(line.inventoryId) as InventoryItem
      item.qtyCurrent += line.quantity
      this.em.inventory.save(item)
      inventoryId = item.id
    }

    const lot = new Lot()
    lot.id = this.em.lots.nextId()
    lot.inventoryId = inventoryId
    lot.transactionId = transactionId
    lot.quantity = line.quantity
    lot.amount = line.amount
    lot.createdAt = isoInstant(this.em.clock)
    this.em.lots.save(lot)
  }
}
