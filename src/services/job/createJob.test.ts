import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createJob } from './createJob'

const mockAppendRows = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    appendRows: mockAppendRows,
  }),
}))

describe('createJob', () => {
  beforeEach(() => {
    mockAppendRows.mockReset()
    mockReadRows.mockReset()
    mockReadRows.mockResolvedValue([])
  })

  it('appends job with J1 id and draft status', async () => {
    await createJob('spreadsheet-1', {
      client_id: 'CL1',
      description: 'Test print',
    })

    expect(mockAppendRows).toHaveBeenCalledTimes(1)
    expect(mockAppendRows).toHaveBeenCalledWith(
      'spreadsheet-1',
      'jobs',
      [
        expect.objectContaining({
          id: 'J1',
          client_id: 'CL1',
          description: 'Test print',
          status: 'draft',
          price: '',
        }),
      ]
    )
    const row = mockAppendRows.mock.calls[0][2][0] as { created_at: string }
    expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('increments job id when jobs exist', async () => {
    mockReadRows.mockResolvedValue([{ id: 'J1' }, { id: 'J2' }])

    await createJob('spreadsheet-1', {
      client_id: 'CL2',
      description: 'Next',
      price: 42,
    })

    expect(mockAppendRows).toHaveBeenCalledWith(
      'spreadsheet-1',
      'jobs',
      [
        expect.objectContaining({
          id: 'J3',
          price: 42,
        }),
      ]
    )
  })

  it('allows price 0', async () => {
    await createJob('spreadsheet-1', {
      client_id: 'CL1',
      description: 'Gift',
      price: 0,
    })

    expect(mockAppendRows).toHaveBeenCalledWith(
      'spreadsheet-1',
      'jobs',
      [
        expect.objectContaining({
          price: 0,
        }),
      ]
    )
  })
})
