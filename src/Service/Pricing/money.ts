import type { Transaction } from '@/Entity/Transaction'

/** `€12.34` / `-€5.00` — € prefix, two decimals, leading minus. */
export function formatCurrency(amount: number): string {
  const sign = amount >= 0 ? '' : '-'
  return `${sign}€${Math.abs(amount).toFixed(2)}`
}

/** Sum of active transaction amounts (income positive, expense negative). */
export function calculateBalance(transactions: Transaction[]): number {
  let balance = 0
  for (const transaction of transactions) {
    if (!transaction.isActive()) continue
    balance += transaction.amount ?? 0
  }
  return balance
}
