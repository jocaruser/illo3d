import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateExpense } from './updateExpense'

const mockUpdateRow = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    updateRow: mockUpdateRow,
  }),
}))

describe('updateExpense', () => {
  beforeEach(() => {
    mockUpdateRow.mockReset()
    mockReadRows.mockReset()
  })

  it('updates expense and linked transaction', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'expenses') {
        return Promise.resolve([
          {
            id: 'E1',
            date: '2025-01-01',
            category: 'other',
            amount: 10,
            notes: '',
          },
        ])
      }
      if (sheet === 'transactions') {
        return Promise.resolve([
          {
            id: 'T1',
            date: '2025-01-01',
            type: 'expense',
            amount: -10,
            category: 'other',
            concept: 'other',
            ref_type: 'expense',
            ref_id: 'E1',
            client_id: '',
            notes: '',
          },
        ])
      }
      return Promise.resolve([])
    })

    await updateExpense('s1', 'E1', {
      date: '2025-02-02',
      category: 'filament',
      amount: 20,
      notes: 'PLA',
    })

    expect(mockUpdateRow).toHaveBeenCalledWith('s1', 'expenses', 1, {
      id: 'E1',
      date: '2025-02-02',
      category: 'filament',
      amount: 20,
      notes: 'PLA',
    })
    expect(mockUpdateRow).toHaveBeenCalledWith('s1', 'transactions', 1, {
      id: 'T1',
      date: '2025-02-02',
      type: 'expense',
      amount: -20,
      category: 'filament',
      concept: 'PLA',
      ref_type: 'expense',
      ref_id: 'E1',
      client_id: '',
      notes: 'PLA',
    })
  })

  it('uses category as concept when notes empty', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'expenses') {
        return Promise.resolve([
          {
            id: 'E1',
            date: '2025-01-01',
            category: 'other',
            amount: 10,
            notes: 'old',
          },
        ])
      }
      if (sheet === 'transactions') {
        return Promise.resolve([
          {
            id: 'T1',
            date: '2025-01-01',
            type: 'expense',
            amount: -10,
            category: 'other',
            concept: 'old',
            ref_type: 'expense',
            ref_id: 'E1',
            notes: 'old',
          },
        ])
      }
      return Promise.resolve([])
    })

    await updateExpense('s1', 'E1', {
      date: '2025-01-01',
      category: 'electric',
      amount: 15,
      notes: '',
    })

    expect(mockUpdateRow).toHaveBeenCalledWith(
      's1',
      'transactions',
      1,
      expect.objectContaining({
        concept: 'electric',
        category: 'electric',
        amount: -15,
        notes: '',
      })
    )
  })
})
