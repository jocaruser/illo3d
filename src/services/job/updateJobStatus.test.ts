import { describe, it, expect, beforeEach } from 'vitest'
import { updateJobStatus } from './updateJobStatus'
import type { Job } from '@/types/money'
import { matrixToJobs, matrixToTransactions } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

const baseJob: Job = {
  id: 'J1',
  client_id: 'CL1',
  description: 'Part A',
  status: 'draft',
  created_at: '2025-01-01T00:00:00.000Z',
}

function seedJobsAndTransactions(
  jobs: Record<string, string | number | undefined>[],
  transactions: Record<string, string | number | undefined>[] = [],
) {
  resetAndSeedWorkbook({
    jobs: matrixWithRows('jobs', jobs),
    transactions:
      transactions.length > 0
        ? matrixWithRows('transactions', transactions)
        : undefined,
  })
}

describe('updateJobStatus', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('updates row only when moving to in_progress', async () => {
    seedJobsAndTransactions([
      {
        id: baseJob.id,
        client_id: baseJob.client_id,
        description: baseJob.description,
        status: baseJob.status,
        price: '',
        created_at: baseJob.created_at,
      },
    ])

    await updateJobStatus('spreadsheet-1', baseJob, 'in_progress')

    expect(matrixToJobs(useWorkbookStore.getState().tabs.jobs)[0]?.status).toBe(
      'in_progress',
    )
    expect(
      matrixToTransactions(useWorkbookStore.getState().tabs.transactions),
    ).toHaveLength(0)
  })

  it('appends income transaction when marking paid with existing price', async () => {
    const job: Job = { ...baseJob, status: 'delivered', price: 25 }
    seedJobsAndTransactions(
      [
        {
          id: job.id,
          client_id: job.client_id,
          description: job.description,
          status: job.status,
          price: 25,
          created_at: job.created_at,
        },
      ],
      [
        {
          id: 'T1',
          date: '2025-01-01',
          type: 'expense',
          amount: '-1',
          category: 'x',
          concept: 'x',
          ref_type: 'expense',
          ref_id: 'E1',
          client_id: '',
          notes: '',
        },
      ],
    )

    await updateJobStatus('spreadsheet-1', job, 'paid')

    const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
    expect(jobs[0]?.status).toBe('paid')
    expect(jobs[0]?.price).toBe(25)

    const txs = matrixToTransactions(
      useWorkbookStore.getState().tabs.transactions,
    )
    const income = txs.find((t) => t.ref_type === 'job' && t.ref_id === 'J1')
    expect(income).toMatchObject({
      type: 'income',
      amount: 25,
      category: 'job',
      client_id: 'CL1',
      concept: 'Part A',
    })
  })

  it('uses paidPrice when job has no price', async () => {
    seedJobsAndTransactions([
      {
        id: baseJob.id,
        client_id: baseJob.client_id,
        description: baseJob.description,
        status: baseJob.status,
        price: '',
        created_at: baseJob.created_at,
      },
    ])

    await updateJobStatus('spreadsheet-1', baseJob, 'paid', {
      paidPrice: 15,
    })

    const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
    expect(jobs[0]?.status).toBe('paid')
    expect(jobs[0]?.price).toBe(15)

    const txs = matrixToTransactions(
      useWorkbookStore.getState().tabs.transactions,
    )
    expect(txs.some((t) => t.type === 'income' && t.amount === 15)).toBe(true)
  })

  it('does not append transaction when createIncomeTransaction is false', async () => {
    const job: Job = { ...baseJob, status: 'delivered', price: 25 }
    seedJobsAndTransactions([
      {
        id: job.id,
        client_id: job.client_id,
        description: job.description,
        status: job.status,
        price: 25,
        created_at: job.created_at,
      },
    ])

    await updateJobStatus('spreadsheet-1', job, 'paid', {
      createIncomeTransaction: false,
    })

    expect(
      matrixToTransactions(useWorkbookStore.getState().tabs.transactions),
    ).toHaveLength(0)
    expect(matrixToJobs(useWorkbookStore.getState().tabs.jobs)[0]?.status).toBe(
      'paid',
    )
  })

  it('throws when paid without price', async () => {
    seedJobsAndTransactions([
      {
        id: baseJob.id,
        client_id: baseJob.client_id,
        description: baseJob.description,
        status: baseJob.status,
        price: '',
        created_at: baseJob.created_at,
      },
    ])

    await expect(
      updateJobStatus('spreadsheet-1', baseJob, 'paid'),
    ).rejects.toThrow(/price/i)
  })

  it('throws when job id not found', async () => {
    resetAndSeedWorkbook({})

    await expect(
      updateJobStatus('spreadsheet-1', baseJob, 'delivered'),
    ).rejects.toThrow(/not found/)
  })
})
