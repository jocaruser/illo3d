import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateClient } from './updateClient'

const mockUpdateRow = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    updateRow: mockUpdateRow,
  }),
}))

describe('updateClient', () => {
  beforeEach(() => {
    mockUpdateRow.mockReset()
    mockReadRows.mockReset()
  })

  it('updates row by client id', async () => {
    mockReadRows.mockResolvedValue([
      {
        id: 'CL1',
        name: 'Old',
        email: 'o@x.com',
        phone: '',
        notes: '',
        preferred_contact: '',
        lead_source: '',
        address: '',
        created_at: '2025-01-01',
      },
    ])

    await updateClient('s1', 'CL1', {
      name: 'New',
      email: 'n@x.com',
      phone: '+1',
      notes: 'Hi',
      preferred_contact: 'Email',
      lead_source: '',
      address: '',
    })

    expect(mockUpdateRow).toHaveBeenCalledWith('s1', 'clients', 1, {
      id: 'CL1',
      name: 'New',
      email: 'n@x.com',
      phone: '+1',
      notes: 'Hi',
      preferred_contact: 'Email',
      lead_source: '',
      address: '',
      created_at: '2025-01-01',
    })
  })

  it('throws when client missing', async () => {
    mockReadRows.mockResolvedValue([])

    await expect(updateClient('s1', 'CL9', { name: 'X' })).rejects.toThrow(
      'Client CL9 not found'
    )
    expect(mockUpdateRow).not.toHaveBeenCalled()
  })
})
