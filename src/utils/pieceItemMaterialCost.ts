import type { Expense, Inventory, PieceItem } from '@/types/money'

function unitCostForLot(
  inv: Inventory | undefined,
  expenses: Expense[],
): number | null {
  if (!inv) return null
  if (!Number.isFinite(inv.qty_initial) || inv.qty_initial <= 0) return null
  const expense = expenses.find((e) => e.id === inv.expense_id)
  if (!expense || !Number.isFinite(expense.amount)) return null
  return expense.amount / inv.qty_initial
}

/** Quantity × (linked expense amount ÷ initial lot size), or null if data is missing. */
export function materialCostForPieceItemLine(
  line: PieceItem,
  inventoryRows: Inventory[],
  expenses: Expense[],
): number | null {
  const inv = inventoryRows.find((i) => i.id === line.inventory_id)
  const unit = unitCostForLot(inv, expenses)
  if (unit == null) return null
  const qty =
    typeof line.quantity === 'number' ? line.quantity : Number(line.quantity)
  if (!Number.isFinite(qty)) return null
  return qty * unit
}
