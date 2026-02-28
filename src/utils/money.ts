export function formatCurrency(amount: number): string {
  const formatted = Math.abs(amount).toFixed(2)
  const sign = amount >= 0 ? '' : '-'
  return `${sign}€${formatted}`
}

export function calculateBalance(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0)
}
