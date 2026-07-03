import type { Job } from '@/types/money'

export function jobDueDate(job: Job): Date {
  return new Date(job.created_at)
}

export function daysSinceDueDate(job: Job): number {
  const dueDate = jobDueDate(job)
  if (isNaN(dueDate.getTime())) return 0
  const now = new Date()
  const diffMs = now.getTime() - dueDate.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.max(0, days)
}
