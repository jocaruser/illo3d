import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateJob } from './updateJob'

const mockUpdateRow = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    updateRow: mockUpdateRow,
  }),
}))

describe('updateJob', () => {
  beforeEach(() => {
    mockUpdateRow.mockReset()
    mockReadRows.mockReset()
  })

  it('updates description, client_id, and price', async () => {
    mockReadRows.mockResolvedValue([
      {
        id: 'J1',
        client_id: 'CL1',
        description: 'Old',
        status: 'draft',
        price: 10,
        created_at: '2025-01-01',
      },
    ])

    await updateJob('s1', 'J1', {
      description: 'New desc',
      client_id: 'CL2',
      price: 25,
    })

    expect(mockUpdateRow).toHaveBeenCalledWith('s1', 'jobs', 1, {
      id: 'J1',
      client_id: 'CL2',
      description: 'New desc',
      status: 'draft',
      price: 25,
      created_at: '2025-01-01',
    })
  })

  it('clears price when undefined', async () => {
    mockReadRows.mockResolvedValue([
      {
        id: 'J1',
        client_id: 'CL1',
        description: 'X',
        status: 'draft',
        price: 10,
        created_at: '2025-01-01',
      },
    ])

    await updateJob('s1', 'J1', {
      description: 'X',
      client_id: 'CL1',
    })

    expect(mockUpdateRow).toHaveBeenCalledWith('s1', 'jobs', 1, {
      id: 'J1',
      client_id: 'CL1',
      description: 'X',
      status: 'draft',
      price: '',
      created_at: '2025-01-01',
    })
  })

  it('throws when job not found', async () => {
    mockReadRows.mockResolvedValue([])

    await expect(
      updateJob('s1', 'J99', { description: 'A', client_id: 'CL1' })
    ).rejects.toThrow('Job J99 not found')
    expect(mockUpdateRow).not.toHaveBeenCalled()
  })
})
