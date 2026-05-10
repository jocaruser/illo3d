import { appendDataRow, updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import {
  matrixToJobs,
  matrixToPieces,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { nextNumericId } from '@/utils/id'
import { incomeAmountForPaidJob } from '@/utils/jobPiecePricing'
import { useWorkbookStore } from '@/stores/workbookStore'

export interface CompleteJobResult {
  completedAt: string
  transactionId?: string
  transactionAmount?: number
}

export async function completeJob(
  _spreadsheetId: string,
  jobId: string,
  createIncomeTransaction: boolean
): Promise<CompleteJobResult> {
  const store = useWorkbookStore.getState()
  const jobs = matrixToJobs(store.tabs.jobs)
  const job = jobs.find((j) => j.id === jobId)
  if (!job) {
    throw new Error(`Job ${jobId} not found`)
  }

  const completedAt = new Date().toISOString()

  // Update job with completed date
  patchWorkbookTab('jobs', (m) =>
    updateDataRowById('jobs', m, jobId, {
      ...job,
      completed: completedAt,
    })
  )

  const result: CompleteJobResult = {
    completedAt,
  }

  // Create income transaction if requested
  if (createIncomeTransaction) {
    const pieces = matrixToPieces(store.tabs.pieces)
    let amount: number
    try {
      amount = incomeAmountForPaidJob(jobId, pieces)
    } catch {
      amount = 0
    }

    const transactions = matrixToTransactions(store.tabs.transactions)
    const txId = nextNumericId(
      'T',
      transactions.map((t) => t.id)
    )

    patchWorkbookTab('transactions', (m) =>
      appendDataRow('transactions', m, {
        id: txId,
        date: new Date().toISOString().slice(0, 10),
        type: 'income',
        amount: String(amount),
        category: 'job',
        concept: job.description || `Job ${jobId}`,
        ref_type: 'job',
        ref_id: jobId,
        client_id: job.client_id,
      })
    )

    result.transactionId = txId
    result.transactionAmount = amount
  }

  return result
}