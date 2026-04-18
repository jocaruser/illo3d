/** Same order of magnitude as `createPurchase` line-sum validation. */
export const EXPENSE_LOT_SUM_EPSILON = 0.01

export function isExpenseLotSumMismatch(
  lotAmounts: readonly number[],
  transactionAmount: number,
  epsilon = EXPENSE_LOT_SUM_EPSILON,
): boolean {
  if (lotAmounts.length === 0) return false
  const sumLots = lotAmounts.reduce((s, a) => s + a, 0)
  const absTxn = Math.abs(transactionAmount)
  return Math.abs(sumLots - absTxn) > epsilon
}
