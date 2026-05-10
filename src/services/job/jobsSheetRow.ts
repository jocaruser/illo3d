import type { Job } from '@/types/money'

export function jobToJobsSheetRow(job: Job): Record<string, unknown> {
  return {
    id: job.id,
    client_id: job.client_id,
    description: job.description,
    price:
      job.price !== undefined && job.price !== null ? job.price : '',
    due_date: job.due_date ?? '',
    completed: job.completed ?? '',
    created_at: job.created_at,
    archived: job.archived ?? '',
    deleted: job.deleted ?? '',
  }
}