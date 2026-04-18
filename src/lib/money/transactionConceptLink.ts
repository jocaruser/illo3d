import type { Lot, Transaction } from '@/types/money'

export type TransactionConceptLink = {
  to: string
  testId: string
}

export function buildExpenseLotLinkMaps(lots: Lot[]): {
  expenseTxnIdsWithLots: Set<string>
  inventoryIdByExpenseTxnId: Map<string, string>
} {
  const expenseTxnIdsWithLots = new Set<string>()
  const inventoryIdByExpenseTxnId = new Map<string, string>()
  for (const l of lots) {
    if (l.archived === 'true' || l.deleted === 'true') continue
    expenseTxnIdsWithLots.add(l.transaction_id)
    if (!inventoryIdByExpenseTxnId.has(l.transaction_id)) {
      inventoryIdByExpenseTxnId.set(l.transaction_id, l.inventory_id)
    }
  }
  return { expenseTxnIdsWithLots, inventoryIdByExpenseTxnId }
}

export function getTransactionConceptLink(
  tx: Transaction,
  expenseTxnIdsWithLots: Set<string> | undefined,
): TransactionConceptLink | null {
  if (tx.ref_type === 'job' && tx.ref_id) {
    return {
      to: `/jobs/${tx.ref_id}`,
      testId: `transaction-concept-job-link-${tx.id}`,
    }
  }
  if (tx.type === 'expense' && expenseTxnIdsWithLots?.has(tx.id)) {
    return {
      to: `/transactions/${tx.id}`,
      testId: `transaction-concept-expense-detail-link-${tx.id}`,
    }
  }
  return null
}
