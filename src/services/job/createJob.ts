import { getSheetsRepository } from '@/services/sheets/repository'
import { nextNumericId } from '@/utils/id'

export interface CreateJobPayload {
  client_id: string
  description: string
  price?: number
}

export async function createJob(
  spreadsheetId: string,
  payload: CreateJobPayload
): Promise<void> {
  const repo = getSheetsRepository()
  const jobs = await repo.readRows<{ id: string }>(spreadsheetId, 'jobs')
  const jobId = nextNumericId(
    'J',
    jobs.map((j) => j.id).filter((id): id is string => id != null)
  )
  const createdAt = new Date().toISOString()
  const priceCell =
    payload.price !== undefined && payload.price !== null ? payload.price : ''

  await repo.appendRows(spreadsheetId, 'jobs', [
    {
      id: jobId,
      client_id: payload.client_id,
      description: payload.description,
      status: 'draft',
      price: priceCell,
      created_at: createdAt,
    },
  ])
}
