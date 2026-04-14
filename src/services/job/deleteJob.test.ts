import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteJob } from './deleteJob'

const mockDeleteRow = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    deleteRow: mockDeleteRow,
  }),
}))

describe('deleteJob', () => {
  beforeEach(() => {
    mockDeleteRow.mockReset()
    mockReadRows.mockReset()
  })

  it('cascade-deletes piece_items, pieces, then job', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'jobs') {
        return Promise.resolve([
          { id: 'J0', client_id: 'CL1', description: 'a', status: 'draft', created_at: '' },
          { id: 'J1', client_id: 'CL1', description: 'b', status: 'draft', created_at: '' },
        ])
      }
      if (sheet === 'pieces') {
        return Promise.resolve([
          { id: 'P1', job_id: 'J1', name: 'p1', status: 'pending', created_at: '' },
          { id: 'P2', job_id: 'J1', name: 'p2', status: 'pending', created_at: '' },
        ])
      }
      if (sheet === 'piece_items') {
        return Promise.resolve([
          { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 1 },
          { id: 'PI2', piece_id: 'P2', inventory_id: 'INV1', quantity: 2 },
        ])
      }
      if (sheet === 'transactions') {
        return Promise.resolve([
          { id: 'T1', ref_type: 'job', ref_id: 'J1', date: '', type: 'income', amount: 1, category: '', concept: '' },
        ])
      }
      return Promise.resolve([])
    })

    await deleteJob('s1', 'J1')

    expect(mockDeleteRow.mock.calls).toEqual([
      ['s1', 'piece_items', 2],
      ['s1', 'piece_items', 1],
      ['s1', 'pieces', 2],
      ['s1', 'pieces', 1],
      ['s1', 'jobs', 2],
    ])
  })

  it('deletes only job when no pieces', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'jobs') {
        return Promise.resolve([
          { id: 'J4', client_id: 'CL1', description: 'solo', status: 'paid', created_at: '' },
        ])
      }
      if (sheet === 'pieces') {
        return Promise.resolve([
          { id: 'P9', job_id: 'J9', name: 'other', status: 'pending', created_at: '' },
        ])
      }
      if (sheet === 'piece_items') {
        return Promise.resolve([])
      }
      return Promise.resolve([])
    })

    await deleteJob('s1', 'J4')

    expect(mockDeleteRow.mock.calls).toEqual([['s1', 'jobs', 1]])
  })

  it('throws when job not found', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'jobs') return Promise.resolve([])
      return Promise.resolve([])
    })

    await expect(deleteJob('s1', 'J99')).rejects.toThrow('Job J99 not found')
    expect(mockDeleteRow).not.toHaveBeenCalled()
  })
})
