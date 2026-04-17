import type { Piece } from '@/types/money'

/** Non-deleted pieces for a job (archived still count). */
export function countingPiecesForJob(
  jobId: string,
  pieces: Piece[] | undefined,
): Piece[] {
  return (pieces ?? []).filter(
    (p) => p.job_id === jobId && p.deleted !== 'true',
  )
}

export function piecePriceIsSet(piece: Piece): boolean {
  const p = piece.price
  return typeof p === 'number' && Number.isFinite(p)
}

export type JobPricingState =
  | { kind: 'incomplete' }
  | { kind: 'complete'; total: number }

export function jobPricingState(jobId: string, pieces: Piece[]): JobPricingState {
  const list = countingPiecesForJob(jobId, pieces)
  if (list.length === 0) return { kind: 'incomplete' }
  let total = 0
  for (const p of list) {
    if (!piecePriceIsSet(p)) return { kind: 'incomplete' }
    total += p.price as number
  }
  return { kind: 'complete', total }
}

export function canMarkJobPaid(jobId: string, pieces: Piece[]): boolean {
  return jobPricingState(jobId, pieces).kind === 'complete'
}

export function incomeAmountForPaidJob(jobId: string, pieces: Piece[]): number {
  const s = jobPricingState(jobId, pieces)
  if (s.kind !== 'complete') {
    throw new Error('Job pricing is incomplete or has no priced pieces')
  }
  return s.total
}

export function jobTotalSortValue(jobId: string, pieces: Piece[]): number {
  const s = jobPricingState(jobId, pieces)
  if (s.kind === 'complete') return s.total
  return Number.POSITIVE_INFINITY
}
