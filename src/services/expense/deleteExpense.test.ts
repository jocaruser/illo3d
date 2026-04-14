import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteExpense } from './deleteExpense'

const mockDeleteRow = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    deleteRow: mockDeleteRow,
  }),
}))

describe('deleteExpense', () => {
  beforeEach(() => {
    mockDeleteRow.mockReset()
    mockReadRows.mockReset()
  })

  it('deletes inventory, transactions, then expense', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'expenses') {
        return Promise.resolve([
          { id: 'E1', date: '2025-01-01', category: 'other', amount: 1, notes: '' },
          { id: 'E2', date: '2025-01-02', category: 'other', amount: 2, notes: '' },
        ])
      }
      if (sheet === 'inventory') {
        return Promise.resolve([
          { id: 'INV1', expense_id: 'E2', type: 'filament', name: 'x', qty_initial: 1, qty_current: 1, created_at: '' },
        ])
      }
      if (sheet === 'transactions') {
        return Promise.resolve([
          { id: 'T1', ref_type: 'expense', ref_id: 'E1', date: '', type: 'expense', amount: -1, category: '', concept: '' },
          { id: 'T2', ref_type: 'expense', ref_id: 'E2', date: '', type: 'expense', amount: -2, category: '', concept: '' },
        ])
      }
      return Promise.resolve([])
    })

    await deleteExpense('s1', 'E2')

    expect(mockDeleteRow.mock.calls).toEqual([
      ['s1', 'inventory', 1],
      ['s1', 'transactions', 2],
      ['s1', 'expenses', 2],
    ])
  })
})
