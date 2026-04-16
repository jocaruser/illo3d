import type { Job } from '@/types/money'

function boardOrderValue(job: Job): number {
  const v = job.board_order
  if (v === undefined || v === null || Number.isNaN(Number(v))) return 0
  return Number(v)
}

/** Kanban column order: explicit board_order, then newest first by created_at. */
export function compareJobsForKanban(a: Job, b: Job): number {
  const ao = boardOrderValue(a)
  const bo = boardOrderValue(b)
  if (ao !== bo) return ao - bo
  if (b.created_at > a.created_at) return 1
  if (b.created_at < a.created_at) return -1
  return a.id.localeCompare(b.id)
}

export function sortJobsForKanban(jobs: Job[]): Job[] {
  return [...jobs].sort(compareJobsForKanban)
}
