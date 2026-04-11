import { getSheetsRepository } from '@/services/sheets/repository'
import { nextNumericId } from '@/utils/id'
import type { Job } from '@/types/money'
import type { JobStatus } from '@/types/money'

export interface UpdateJobStatusOptions {
  /** When marking paid and the job has no price yet, the confirmed price (0 allowed). */
  paidPrice?: number
  /**
   * When marking paid: if true (default), appends an income transaction.
   * Set false to update the job only (e.g. payment already recorded elsewhere).
   */
  createIncomeTransaction?: boolean
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

export async function updateJobStatus(
  spreadsheetId: string,
  job: Job,
  newStatus: JobStatus,
  options?: UpdateJobStatusOptions
): Promise<void> {
  const repo = getSheetsRepository()
  const rows = await repo.readRows<Job>(spreadsheetId, 'jobs')
  const idx = rows.findIndex((r) => r.id === job.id)
  if (idx === -1) {
    throw new Error(`Job ${job.id} not found`)
  }
  const rowIndex = idx + 1

  let nextJob: Job = { ...job, status: newStatus }

  if (newStatus === 'paid') {
    const resolved =
      options?.paidPrice !== undefined ? options.paidPrice : job.price
    if (resolved === undefined || resolved === null) {
      throw new Error('Paid job requires a price')
    }
    nextJob = { ...nextJob, price: Number(resolved) }
  }

  await repo.updateRow(
    spreadsheetId,
    'jobs',
    rowIndex,
    sheetRowFromJob(nextJob)
  )

  if (newStatus !== 'paid') {
    return
  }
  if (options?.createIncomeTransaction === false) {
    return
  }

  const amount = nextJob.price ?? 0
  const transactions = await repo.readRows<{ id: string }>(
    spreadsheetId,
    'transactions'
  )
  const transactionId = nextNumericId(
    'T',
    transactions.map((t) => t.id).filter((id): id is string => id != null)
  )
  const today = new Date().toISOString().slice(0, 10)

  await repo.appendRows(spreadsheetId, 'transactions', [
    {
      id: transactionId,
      date: today,
      type: 'income',
      amount,
      category: 'job',
      concept: nextJob.description,
      ref_type: 'job',
      ref_id: nextJob.id,
      client_id: nextJob.client_id ?? '',
      notes: '',
    },
  ])
}
