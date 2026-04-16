import { appendDataRow, updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToJobs, matrixToTransactions } from '@/lib/workbook/workbookEntities'
import { jobToJobsSheetRow } from '@/services/job/jobsSheetRow'
import { nextNumericId } from '@/utils/id'
import { useWorkbookStore } from '@/stores/workbookStore'
import type { Job } from '@/types/money'
import type { JobStatus } from '@/types/money'

export interface UpdateJobStatusOptions {
  paidPrice?: number
  createIncomeTransaction?: boolean
}

export async function updateJobStatus(
  spreadsheetId: string,
  job: Job,
  newStatus: JobStatus,
  options?: UpdateJobStatusOptions
): Promise<Job> {
  void spreadsheetId
  const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
  const idx = jobs.findIndex((r) => r.id === job.id)
  if (idx === -1) {
    throw new Error(`Job ${job.id} not found`)
  }

  let nextJob: Job = { ...job, status: newStatus }

  if (newStatus === 'paid') {
    const resolved =
      options?.paidPrice !== undefined ? options.paidPrice : job.price
    if (resolved === undefined || resolved === null) {
      throw new Error('Paid job requires a price')
    }
    nextJob = { ...nextJob, price: Number(resolved) }
  }

  patchWorkbookTab('jobs', (m) =>
    updateDataRowById('jobs', m, job.id, jobToJobsSheetRow(nextJob)),
  )

  if (newStatus !== 'paid') {
    return nextJob
  }
  if (options?.createIncomeTransaction === false) {
    return nextJob
  }

  const amount = nextJob.price ?? 0
  const transactions = matrixToTransactions(
    useWorkbookStore.getState().tabs.transactions,
  )
  const transactionId = nextNumericId(
    'T',
    transactions.map((t) => t.id).filter((id): id is string => id != null),
  )
  const today = new Date().toISOString().slice(0, 10)

  patchWorkbookTab('transactions', (m) =>
    appendDataRow('transactions', m, {
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
      archived: '',
      deleted: '',
    }),
  )

  return nextJob
}
