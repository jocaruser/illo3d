import type { Job, Piece, Transaction } from '@/types/money'

function isActiveJob(j: Job): boolean {
  return j.archived !== 'true' && j.deleted !== 'true'
}

export function countActiveJobs(jobs: Job[]): number {
  return jobs.filter(
    (j) =>
      isActiveJob(j) &&
      (j.status === 'draft' || j.status === 'in_progress'),
  ).length
}

function transactionMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function isActiveTransaction(t: Transaction): boolean {
  return t.archived !== 'true' && t.deleted !== 'true'
}

export function revenueThisMonth(
  transactions: Transaction[],
  now: Date = new Date(),
): number {
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return transactions
    .filter(
      (t) =>
        isActiveTransaction(t) &&
        t.type === 'income' &&
        transactionMonthKey(t.date) === key,
    )
    .reduce((sum, t) => sum + t.amount, 0)
}

function isActivePiece(p: Piece): boolean {
  return p.archived !== 'true' && p.deleted !== 'true'
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function countPiecesCompletedThisWeek(
  pieces: Piece[],
  now: Date = new Date(),
): number {
  const cutoff = now.getTime() - WEEK_MS
  return pieces.filter((p) => {
    if (!isActivePiece(p) || p.status !== 'done') return false
    const t = Date.parse(p.created_at)
    return !Number.isNaN(t) && t >= cutoff
  }).length
}
