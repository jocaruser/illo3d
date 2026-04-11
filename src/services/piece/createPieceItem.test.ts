import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPieceItem } from './createPieceItem'

const mockAppendRows = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    appendRows: mockAppendRows,
  }),
}))

describe('createPieceItem', () => {
  beforeEach(() => {
    mockAppendRows.mockReset()
    mockReadRows.mockReset()
    mockReadRows.mockResolvedValue([])
  })

  it('appends piece_item with PI1 id', async () => {
    await createPieceItem('spreadsheet-1', {
      piece_id: 'P1',
      inventory_id: 'INV1',
      quantity: 12.5,
    })

    expect(mockAppendRows).toHaveBeenCalledTimes(1)
    expect(mockAppendRows).toHaveBeenCalledWith(
      'spreadsheet-1',
      'piece_items',
      [
        expect.objectContaining({
          id: 'PI1',
          piece_id: 'P1',
          inventory_id: 'INV1',
          quantity: 12.5,
        }),
      ]
    )
  })

  it('increments line id when piece_items exist', async () => {
    mockReadRows.mockResolvedValue([{ id: 'PI1' }])

    await createPieceItem('spreadsheet-1', {
      piece_id: 'P2',
      inventory_id: 'INV2',
      quantity: 1,
    })

    expect(mockAppendRows).toHaveBeenCalledWith(
      'spreadsheet-1',
      'piece_items',
      [expect.objectContaining({ id: 'PI2' })]
    )
  })
})
