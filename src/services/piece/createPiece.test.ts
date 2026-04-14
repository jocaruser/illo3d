import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPiece } from './createPiece'

const mockAppendRows = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    appendRows: mockAppendRows,
  }),
}))

describe('createPiece', () => {
  beforeEach(() => {
    mockAppendRows.mockReset()
    mockReadRows.mockReset()
    mockReadRows.mockResolvedValue([])
  })

  it('appends piece with P1 id and pending status', async () => {
    await createPiece('spreadsheet-1', {
      job_id: 'J1',
      name: 'Lid',
    })

    expect(mockAppendRows).toHaveBeenCalledTimes(1)
    expect(mockAppendRows).toHaveBeenCalledWith(
      'spreadsheet-1',
      'pieces',
      [
        expect.objectContaining({
          id: 'P1',
          job_id: 'J1',
          name: 'Lid',
          status: 'pending',
        }),
      ]
    )
    const row = mockAppendRows.mock.calls[0][2][0] as { created_at: string }
    expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('increments piece id when pieces exist', async () => {
    mockReadRows.mockResolvedValue([{ id: 'P1' }, { id: 'P2' }])

    await createPiece('spreadsheet-1', {
      job_id: 'J2',
      name: 'Next',
    })

    expect(mockAppendRows).toHaveBeenCalledWith(
      'spreadsheet-1',
      'pieces',
      [expect.objectContaining({ id: 'P3' })]
    )
  })
})
