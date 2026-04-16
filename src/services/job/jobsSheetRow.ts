import type { Job } from '@/types/money'

export function jobToJobsSheetRow(job: Job): Record<string, unknown> {
  return {
    id: job.id,
    client_id: job.client_id,
    description: job.description,
    status: job.status,
    price:
      job.price !== undefined && job.price !== null ? job.price : '',
    board_order:
      job.board_order !== undefined &&
      job.board_order !== null &&
      !Number.isNaN(Number(job.board_order))
        ? job.board_order
        : '',
    created_at: job.created_at,
    archived: job.archived ?? '',
    deleted: job.deleted ?? '',
  }
}
