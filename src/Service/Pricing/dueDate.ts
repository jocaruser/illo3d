import type { Job } from '@/Entity/Job'
import { SystemClock, type Clock } from '@/Service/Clock'

export const DEFAULT_KANBAN_STALE_DAYS = 5

export function jobDueDate(job: Job): Date {
  return new Date(job.effectiveDueDate())
}

/** Whole days elapsed since the job's effective due date, floored at 0. */
export function daysSinceDueDate(job: Job, clock: Clock): number {
  const due = jobDueDate(job)
  if (Number.isNaN(due.getTime())) return 0
  const elapsed = clock.now().getTime() - due.getTime()
  return Math.max(0, Math.floor(elapsed / (24 * 60 * 60 * 1000)))
}

export type DueDateBand = 'red' | 'orange' | 'yellow' | 'none'

export function dueDateBand(days: number): DueDateBand {
  if (days >= 7) return 'red'
  if (days >= 5) return 'orange'
  if (days >= 3) return 'yellow'
  return 'none'
}

/** Paid/cancelled cards leave the kanban once stale for more than `staleDays`. */
export function shouldHideJobOnKanban(
  job: Job,
  staleDays: number = DEFAULT_KANBAN_STALE_DAYS,
  clock: Clock = new SystemClock(),
): boolean {
  if (!job.isCompleted() || !job.isActive()) return false
  return daysSinceDueDate(job, clock) > staleDays
}
