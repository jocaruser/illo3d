import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateJobStatus } from './updateJobStatus'
import type { Job } from '@/types/money'

const mockUpdateRow = vi.fn()
const mockAppendRows = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    appendRows: mockAppendRows,
    updateRow: mockUpdateRow,
  }),
}))

const baseJob: Job = {
  id: 'J1',
  client_id: 'CL1',
  description: 'Part A',
  status: 'draft',
  created_at: '2025-01-01T00:00:00.000Z',
}

describe('updateJobStatus', () => {
  beforeEach(() => {
    mockUpdateRow.mockReset()
    mockAppendRows.mockReset()
    mockReadRows.mockReset()
  })

  it('updates row only when moving to in_progress', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'jobs') return Promise.resolve([{ ...baseJob }])
      return Promise.resolve([])
    })

    await updateJobStatus('spreadsheet-1', baseJob, 'in_progress')

    expect(mockUpdateRow).toHaveBeenCalledWith(
      'spreadsheet-1',
      'jobs',
      1,
      expect.objectContaining({
        id: 'J1',
        status: 'in_progress',
      })
    )
    expect(mockAppendRows).not.toHaveBeenCalled()
  })

  it('appends income transaction when marking paid with existing price', async () => {
    const job: Job = { ...baseJob, status: 'delivered', price: 25 }
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'jobs') return Promise.resolve([job])
      if (sheet === 'transactions') return Promise.resolve([{ id: 'T1' }])
      return Promise.resolve([])
    })

    await updateJobStatus('spreadsheet-1', job, 'paid')

    expect(mockUpdateRow).toHaveBeenCalledWith(
      'spreadsheet-1',
      'jobs',
      1,
      expect.objectContaining({
        status: 'paid',
        price: 25,
      })
    )
    expect(mockAppendRows).toHaveBeenCalledWith(
      'spreadsheet-1',
      'transactions',
      [
        expect.objectContaining({
          type: 'income',
          amount: 25,
          category: 'job',
          ref_type: 'job',
          ref_id: 'J1',
          client_id: 'CL1',
          concept: 'Part A',
        }),
      ]
    )
  })

  it('uses paidPrice when job has no price', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'jobs') return Promise.resolve([{ ...baseJob }])
      if (sheet === 'transactions') return Promise.resolve([])
      return Promise.resolve([])
    })

    await updateJobStatus('spreadsheet-1', baseJob, 'paid', {
      paidPrice: 15,
    })

    expect(mockUpdateRow).toHaveBeenCalledWith(
      'spreadsheet-1',
      'jobs',
      1,
      expect.objectContaining({
        status: 'paid',
        price: 15,
      })
    )
    expect(mockAppendRows).toHaveBeenCalledWith(
      'spreadsheet-1',
      'transactions',
      [
        expect.objectContaining({
          amount: 15,
        }),
      ]
    )
  })

  it('does not append transaction when createIncomeTransaction is false', async () => {
    const job: Job = { ...baseJob, status: 'delivered', price: 25 }
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'jobs') return Promise.resolve([job])
      return Promise.resolve([])
    })

    await updateJobStatus('spreadsheet-1', job, 'paid', {
      createIncomeTransaction: false,
    })

    expect(mockUpdateRow).toHaveBeenCalledWith(
      'spreadsheet-1',
      'jobs',
      1,
      expect.objectContaining({ status: 'paid', price: 25 })
    )
    expect(mockAppendRows).not.toHaveBeenCalled()
  })

  it('throws when paid without price', async () => {
    mockReadRows.mockResolvedValue([{ ...baseJob }])

    await expect(
      updateJobStatus('spreadsheet-1', baseJob, 'paid')
    ).rejects.toThrow(/price/i)
  })

  it('throws when job id not found', async () => {
    mockReadRows.mockResolvedValue([])

    await expect(
      updateJobStatus('spreadsheet-1', baseJob, 'delivered')
    ).rejects.toThrow(/not found/)
  })
})
