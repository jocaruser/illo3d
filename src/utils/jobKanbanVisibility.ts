import type { Job } from '@/types/money'
import { daysSinceDueDate } from './jobDueDate'

export const DEFAULT_KANBAN_STALE_DAYS = 5

export function shouldHideJobOnKanban(job: Job, staleDays?: number): boolean {
  if (job.status !== 'paid' && job.status !== 'cancelled') return false
  const threshold = staleDays ?? DEFAULT_KANBAN_STALE_DAYS
  return daysSinceDueDate(job) > threshold
}
