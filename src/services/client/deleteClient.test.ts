import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  CLIENT_DELETE_BLOCKED_JOBS,
  deleteClient,
} from './deleteClient'

const mockDeleteRow = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    deleteRow: mockDeleteRow,
  }),
}))

describe('deleteClient', () => {
  beforeEach(() => {
    mockDeleteRow.mockReset()
    mockReadRows.mockReset()
  })

  it('deletes when no job references client', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'jobs') {
        return Promise.resolve([
          { id: 'J1', client_id: 'CL2', description: '', status: 'draft', created_at: '' },
        ])
      }
      if (sheet === 'clients') {
        return Promise.resolve([
          { id: 'CL1', name: 'A', created_at: '2025-01-01' },
        ])
      }
      return Promise.resolve([])
    })

    await deleteClient('s1', 'CL1')

    expect(mockDeleteRow).toHaveBeenCalledWith('s1', 'clients', 1)
  })

  it('throws when a job references client', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'jobs') {
        return Promise.resolve([
          { id: 'J1', client_id: 'CL1', description: '', status: 'draft', created_at: '' },
        ])
      }
      if (sheet === 'clients') {
        return Promise.resolve([
          { id: 'CL1', name: 'A', created_at: '2025-01-01' },
        ])
      }
      return Promise.resolve([])
    })

    await expect(deleteClient('s1', 'CL1')).rejects.toThrow(
      CLIENT_DELETE_BLOCKED_JOBS
    )
    expect(mockDeleteRow).not.toHaveBeenCalled()
  })
})
