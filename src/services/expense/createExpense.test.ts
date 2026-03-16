import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createExpense } from './createExpense'

const mockAppendRows = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    appendRows: mockAppendRows,
  }),
}))

describe('createExpense', () => {
  beforeEach(() => {
    mockAppendRows.mockReset()
    mockReadRows.mockReset()
    mockReadRows.mockImplementation((_id: string, sheetName: string) => {
      if (sheetName === 'expenses') return Promise.resolve([])
      if (sheetName === 'transactions') return Promise.resolve([])
      return Promise.resolve([])
    })
  })

  it('appends expense and transaction rows with E1 and T1 ids', async () => {
    await createExpense('spreadsheet-1', {
      date: '2025-01-20',
      category: 'electric',
      amount: 75.5,
      notes: 'Monthly bill',
    })

    expect(mockAppendRows).toHaveBeenCalledTimes(2)
    expect(mockAppendRows).toHaveBeenNthCalledWith(
      1,
      'spreadsheet-1',
      'expenses',
      [
        {
          id: 'E1',
          date: '2025-01-20',
          category: 'electric',
          amount: 75.5,
          notes: 'Monthly bill',
        },
      ]
    )
    expect(mockAppendRows).toHaveBeenNthCalledWith(
      2,
      'spreadsheet-1',
      'transactions',
      [
        expect.objectContaining({
          id: 'T1',
          date: '2025-01-20',
          type: 'expense',
          amount: -75.5,
          category: 'electric',
          concept: 'Monthly bill',
          ref_type: 'expense',
          ref_id: 'E1',
          client_id: '',
        }),
      ]
    )
  })

  it('increments ids when expenses and transactions exist', async () => {
    mockReadRows.mockImplementation((_id: string, sheetName: string) => {
      if (sheetName === 'expenses')
        return Promise.resolve([{ id: 'E1' }, { id: 'E2' }])
      if (sheetName === 'transactions')
        return Promise.resolve([{ id: 'T1' }, { id: 'T2' }])
      return Promise.resolve([])
    })

    await createExpense('spreadsheet-1', {
      date: '2025-01-21',
      category: 'maintenance',
      amount: 30,
    })

    expect(mockAppendRows).toHaveBeenNthCalledWith(
      1,
      'spreadsheet-1',
      'expenses',
      [
        {
          id: 'E3',
          date: '2025-01-21',
          category: 'maintenance',
          amount: 30,
          notes: '',
        },
      ]
    )
    expect(mockAppendRows).toHaveBeenNthCalledWith(
      2,
      'spreadsheet-1',
      'transactions',
      [
        expect.objectContaining({
          id: 'T3',
          ref_id: 'E3',
          concept: 'maintenance',
        }),
      ]
    )
  })
})
