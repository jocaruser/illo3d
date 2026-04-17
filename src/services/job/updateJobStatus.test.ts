import { describe, it, expect, beforeEach } from 'vitest'
import { updateJobStatus } from './updateJobStatus'
import type { Job } from '@/types/money'
import {
  matrixToJobs,
  matrixToTransactions,
} from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

const baseJob: Job = {
  id: 'J1',
  client_id: 'CL1',
  description: 'Part A',
  status: 'draft',
  created_at: '2025-01-01T00:00:00.000Z',
}

describe('updateJobStatus', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('updates row only when moving to in_progress', async () => {
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [
        {
          id: baseJob.id,
          client_id: baseJob.client_id,
          description: baseJob.description,
          status: baseJob.status,
          price: '',
          board_order: '',
          created_at: baseJob.created_at,
        },
      ]),
    })

    await updateJobStatus('spreadsheet-1', baseJob, 'in_progress')

    expect(matrixToJobs(useWorkbookStore.getState().tabs.jobs)[0]?.status).toBe(
      'in_progress',
    )
    expect(
      matrixToTransactions(useWorkbookStore.getState().tabs.transactions),
    ).toHaveLength(0)
  })

  it('appends income transaction for paidPrice from piece totals', async () => {
    const job: Job = { ...baseJob, status: 'delivered' }
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [
        {
          id: job.id,
          client_id: job.client_id,
          description: job.description,
          status: job.status,
          price: '',
          board_order: '',
          created_at: job.created_at,
        },
      ]),
      pieces: matrixWithRows('pieces', [
        {
          id: 'P1',
          job_id: 'J1',
          name: 'Part',
          status: 'pending',
          price: 25,
          created_at: '2025-01-01',
        },
      ]),
      transactions: matrixWithRows('transactions', [
        {
          id: 'T1',
          date: '2025-01-01',
          type: 'expense',
          amount: '-1',
          category: 'x',
          concept: 'x',
          ref_type: '',
          ref_id: '',
          client_id: '',
          notes: '',
        },
      ]),
    })

    await updateJobStatus('spreadsheet-1', job, 'paid', { paidPrice: 25 })

    const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
    expect(jobs[0]?.status).toBe('paid')
    expect(jobs[0]?.price).toBeUndefined()

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

  it('does not write job sheet price from paidPrice', async () => {
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [
        {
          id: baseJob.id,
          client_id: baseJob.client_id,
          description: baseJob.description,
          status: baseJob.status,
          price: '',
          board_order: '',
          created_at: baseJob.created_at,
        },
      ]),
      pieces: matrixWithRows('pieces', [
        {
          id: 'P1',
          job_id: 'J1',
          name: 'Part',
          status: 'pending',
          price: 15,
          created_at: '2025-01-01',
        },
      ]),
    })

    await updateJobStatus('spreadsheet-1', baseJob, 'paid', {
      paidPrice: 15,
    })

    const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
    expect(jobs[0]?.status).toBe('paid')
    expect(jobs[0]?.price).toBeUndefined()

    const txs = matrixToTransactions(
      useWorkbookStore.getState().tabs.transactions,
    )
    expect(txs.some((t) => t.type === 'income' && t.amount === 15)).toBe(true)
  })

  it('does not append transaction when createIncomeTransaction is false', async () => {
    const job: Job = { ...baseJob, status: 'delivered' }
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [
        {
          id: job.id,
          client_id: job.client_id,
          description: job.description,
          status: job.status,
          price: '',
          board_order: '',
          created_at: job.created_at,
        },
      ]),
      pieces: matrixWithRows('pieces', [
        {
          id: 'P1',
          job_id: 'J1',
          name: 'Part',
          status: 'pending',
          price: 25,
          created_at: '2025-01-01',
        },
      ]),
    })

    await updateJobStatus('spreadsheet-1', job, 'paid', {
      paidPrice: 25,
      createIncomeTransaction: false,
    })

    expect(
      matrixToTransactions(useWorkbookStore.getState().tabs.transactions),
    ).toHaveLength(0)
    expect(matrixToJobs(useWorkbookStore.getState().tabs.jobs)[0]?.status).toBe(
      'paid',
    )
  })

  it('throws when paid without paidPrice', async () => {
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [
        {
          id: baseJob.id,
          client_id: baseJob.client_id,
          description: baseJob.description,
          status: baseJob.status,
          price: '',
          board_order: '',
          created_at: baseJob.created_at,
        },
      ]),
    })

    await expect(
      updateJobStatus('spreadsheet-1', baseJob, 'paid'),
    ).rejects.toThrow(/paidPrice/i)
  })

  it('throws when job id not found', async () => {
    resetAndSeedWorkbook({})

    await expect(
      updateJobStatus('spreadsheet-1', baseJob, 'delivered'),
    ).rejects.toThrow(/not found/)
  })

  it('merges new status into the current workbook row, not a stale job snapshot', async () => {
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [
        {
          id: baseJob.id,
          client_id: baseJob.client_id,
          description: 'Fresh description',
          status: 'draft',
          price: '',
          board_order: '',
          created_at: baseJob.created_at,
        },
      ]),
    })

    const stale: Job = {
      ...baseJob,
      description: 'Stale from UI payload',
      status: 'draft',
    }

    await updateJobStatus('spreadsheet-1', stale, 'in_progress')

    const updated = matrixToJobs(useWorkbookStore.getState().tabs.jobs)[0]
    expect(updated?.description).toBe('Fresh description')
    expect(updated?.status).toBe('in_progress')
  })
})
