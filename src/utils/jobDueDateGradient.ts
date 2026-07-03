import type { Job } from '@/types/money'
import { jobDueDate, daysSinceDueDate } from './jobDueDate'

export interface DueDateGradient {
  days: number
  label: string
  bgClass: string
  textClass: string
}

export function jobDueDateGradient(job: Job): DueDateGradient {
  const days = daysSinceDueDate(job)
  void jobDueDate(job)

  if (days >= 7) {
    return {
      days,
      label: `${days} days ago`,
      bgClass: 'bg-red-100 dark:bg-red-900/40',
      textClass: 'text-red-800 dark:text-red-200',
    }
  }
  if (days >= 5) {
    return {
      days,
      label: `${days} days ago`,
      bgClass: 'bg-orange-100 dark:bg-orange-900/40',
      textClass: 'text-orange-800 dark:text-orange-200',
    }
  }
  if (days >= 3) {
    return {
      days,
      label: `${days} days ago`,
      bgClass: 'bg-yellow-100 dark:bg-yellow-900/40',
      textClass: 'text-yellow-800 dark:text-yellow-200',
    }
  }
  return {
    days,
    label: `${days} days ago`,
    bgClass: 'bg-gray-50 dark:bg-gray-800',
    textClass: 'text-gray-700 dark:text-gray-300',
  }
}
