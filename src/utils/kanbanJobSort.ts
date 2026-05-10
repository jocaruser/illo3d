import type { Job } from '@/types/money'

/** Jobs are sorted by created_at desc (newest first) since v2.0.0 removed board_order from jobs.
 *  In v2, board_order only exists on pieces.
 */
export function compareJobsForKanban(a: Job, b: Job): number {
  // Sort by created_at desc (newest first)
  if (b.created_at > a.created_at) return 1
  if (b.created_at < a.created_at) return -1
  return a.id.localeCompare(b.id)
}

export function sortJobsForKanban(jobs: Job[]): Job[] {
  return [...jobs].sort(compareJobsForKanban)
}
