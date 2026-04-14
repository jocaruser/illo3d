import { getSheetsRepository } from '@/services/sheets/repository'
import type { Job } from '@/types/money'

export interface UpdateJobPayload {
  description: string
  client_id: string
  /** Omitted or undefined means clear price in the sheet. */
  price?: number
}

function sheetRowFromJob(job: Job): Record<string, unknown> {
  return {
    id: job.id,
    client_id: job.client_id,
    description: job.description,
    status: job.status,
    price:
      job.price !== undefined && job.price !== null ? job.price : '',
    created_at: job.created_at,
  }
}

export async function updateJob(
  spreadsheetId: string,
  jobId: string,
  payload: UpdateJobPayload
): Promise<void> {
  const repo = getSheetsRepository()
  const rows = await repo.readRows<Job>(spreadsheetId, 'jobs')
  const idx = rows.findIndex((r) => r.id === jobId)
  if (idx === -1) {
    throw new Error(`Job ${jobId} not found`)
  }
  const existing = rows[idx]
  const next: Job = {
    ...existing,
    description: payload.description.trim(),
    client_id: payload.client_id,
    price: payload.price,
  }
  await repo.updateRow(
    spreadsheetId,
    'jobs',
    idx + 1,
    sheetRowFromJob(next)
  )
}
