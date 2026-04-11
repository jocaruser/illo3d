import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from './createClient'

const mockAppendRows = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    appendRows: mockAppendRows,
  }),
}))

describe('createClient', () => {
  beforeEach(() => {
    mockAppendRows.mockReset()
    mockReadRows.mockReset()
    mockReadRows.mockImplementation((_id: string, sheetName: string) => {
      if (sheetName === 'clients') return Promise.resolve([])
      return Promise.resolve([])
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('appends client row with CL1 when no CL-prefixed ids exist', async () => {
    mockReadRows.mockResolvedValue([{ id: 'c1' }])

    await createClient('spreadsheet-1', {
      name: 'New Corp',
      email: 'n@example.com',
      phone: '+1',
      notes: 'Hi',
    })

    expect(mockAppendRows).toHaveBeenCalledTimes(1)
    expect(mockAppendRows).toHaveBeenCalledWith('spreadsheet-1', 'clients', [
      {
        id: 'CL1',
        name: 'New Corp',
        email: 'n@example.com',
        phone: '+1',
        notes: 'Hi',
        created_at: '2025-06-15',
      },
    ])
  })

  it('increments to CL3 when CL1 and CL2 exist', async () => {
    mockReadRows.mockResolvedValue([{ id: 'CL1' }, { id: 'CL2' }])

    await createClient('spreadsheet-1', { name: 'Next' })

    expect(mockAppendRows).toHaveBeenCalledWith(
      'spreadsheet-1',
      'clients',
      [
        expect.objectContaining({
          id: 'CL3',
          name: 'Next',
          email: '',
          phone: '',
          notes: '',
          created_at: '2025-06-15',
        }),
      ]
    )
  })
})
