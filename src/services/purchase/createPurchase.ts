import { appendDataRow, updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import {
  matrixToInventory,
  matrixToLots,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { nextNumericId } from '@/utils/id'
import { useWorkbookStore } from '@/stores/workbookStore'
import type { InventoryType, PurchaseCategory } from '@/types/money'

export type PurchaseLine =
  | {
      mode: 'existing'
      inventoryId: string
      quantity: number
      amount: number
    }
  | {
      mode: 'new'
      type: InventoryType
      name: string
      quantity: number
      amount: number
    }

export interface CreatePurchasePayload {
  date: string
  category: PurchaseCategory
  notes?: string
  addToInventory: boolean
  /** Positive total; when addToInventory, must equal sum of line amounts. */
  amount: number
  lines?: PurchaseLine[]
}

export async function createPurchase(
  _spreadsheetId: string,
  payload: CreatePurchasePayload
): Promise<void> {
  void _spreadsheetId
  const tabs = useWorkbookStore.getState().tabs
  const transactions = matrixToTransactions(tabs.transactions)

  const transactionId = nextNumericId(
    'T',
    transactions.map((t) => t.id).filter((id): id is string => Boolean(id)),
  )

  let total = payload.amount
  if (payload.addToInventory) {
    const lines = payload.lines ?? []
    if (lines.length === 0) {
      throw new Error('At least one inventory line is required')
    }
    const sum = lines.reduce((s, l) => s + l.amount, 0)
    if (!Number.isFinite(sum) || sum <= 0) {
      throw new Error('Invalid line amounts')
    }
    if (Math.abs(sum - payload.amount) > 0.0001) {
      throw new Error('Total amount must match sum of line items')
    }
    total = sum
  } else if (!Number.isFinite(total) || total <= 0) {
    throw new Error('Invalid amount')
  }

  const trimmedNotes = payload.notes?.trim() ?? ''
  const concept = trimmedNotes !== '' ? trimmedNotes : payload.category

  patchWorkbookTab('transactions', (m) =>
    appendDataRow('transactions', m, {
      id: transactionId,
      date: payload.date,
      type: 'expense',
      amount: -Math.abs(total),
      category: payload.category,
      concept,
      ref_type: '',
      ref_id: '',
      client_id: '',
      notes: payload.notes ?? '',
      archived: '',
      deleted: '',
    }),
  )

  if (!payload.addToInventory) return

  const lines = payload.lines!
  const now = new Date().toISOString()

  for (const line of lines) {
    if (line.mode === 'new') {
      const inventoryId = nextNumericId(
        'INV',
        matrixToInventory(useWorkbookStore.getState().tabs.inventory).map(
          (r) => r.id,
        ),
      )
      patchWorkbookTab('inventory', (m) =>
        appendDataRow('inventory', m, {
          id: inventoryId,
          type: line.type,
          name: line.name.trim(),
          qty_current: line.quantity,
          warn_yellow: 0,
          warn_orange: 0,
          warn_red: 0,
          created_at: now,
          archived: '',
          deleted: '',
        }),
      )
      const lotId = nextNumericId(
        'L',
        matrixToLots(useWorkbookStore.getState().tabs.lots).map((l) => l.id),
      )
      patchWorkbookTab('lots', (m) =>
        appendDataRow('lots', m, {
          id: lotId,
          inventory_id: inventoryId,
          transaction_id: transactionId,
          quantity: line.quantity,
          amount: line.amount,
          created_at: now,
          archived: '',
          deleted: '',
        }),
      )
      continue
    }

    const invList = matrixToInventory(useWorkbookStore.getState().tabs.inventory)
    const inv = invList.find((i) => i.id === line.inventoryId)
    if (!inv) throw new Error(`Inventory ${line.inventoryId} not found`)
    const nextQty = inv.qty_current + line.quantity
    patchWorkbookTab('inventory', (m) =>
      updateDataRowById('inventory', m, line.inventoryId, {
        id: inv.id,
        type: inv.type,
        name: inv.name,
        qty_current: nextQty,
        warn_yellow: inv.warn_yellow,
        warn_orange: inv.warn_orange,
        warn_red: inv.warn_red,
        created_at: inv.created_at,
        archived: inv.archived ?? '',
        deleted: inv.deleted ?? '',
      }),
    )
    const lotId = nextNumericId(
      'L',
      matrixToLots(useWorkbookStore.getState().tabs.lots).map((l) => l.id),
    )
    patchWorkbookTab('lots', (m) =>
      appendDataRow('lots', m, {
        id: lotId,
        inventory_id: line.inventoryId,
        transaction_id: transactionId,
        quantity: line.quantity,
        amount: line.amount,
        created_at: now,
        archived: '',
        deleted: '',
      }),
    )
  }
}
