import type { Job } from '@/Entity/Job'
import type { Piece } from '@/Entity/Piece'
import type { Transaction } from '@/Entity/Transaction'
import { isoDay, type Clock } from '@/Service/Clock'

export function activeJobsCount(jobs: Job[]): number {
  return jobs.filter((job) => job.isActive() && job.isOpen()).length
}

/** Sum of active income transactions dated in the clock's current `YYYY-MM`. */
export function revenueThisMonth(transactions: Transaction[], clock: Clock): number {
  const monthKey = isoDay(clock).slice(0, 7)
  let total = 0
  for (const transaction of transactions) {
    if (!transaction.isActive() || !transaction.isIncome()) continue
    if (transaction.date.slice(0, 7) !== monthKey) continue
    total += transaction.amount ?? 0
  }
  return total
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** Active pieces marked done whose created_at falls within the last 7 days. */
export function piecesDoneThisWeek(pieces: Piece[], clock: Clock): number {
  const cutoff = clock.now().getTime() - WEEK_MS
  return pieces.filter((piece) => {
    if (!piece.isActive() || piece.status !== 'done') return false
    const createdMs = Date.parse(piece.createdAt)
    return !Number.isNaN(createdMs) && createdMs >= cutoff
  }).length
}
