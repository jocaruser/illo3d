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

  it('does not read or append inventory when inventory is omitted', async () => {
    const readSheets: string[] = []
    mockReadRows.mockImplementation((_id: string, sheetName: string) => {
      readSheets.push(sheetName)
      if (sheetName === 'expenses') return Promise.resolve([])
      if (sheetName === 'transactions') return Promise.resolve([])
      return Promise.resolve([])
    })

    await createExpense('spreadsheet-1', {
      date: '2025-01-22',
      category: 'electric',
      amount: 10,
    })

    expect(readSheets).not.toContain('inventory')
    expect(mockAppendRows).toHaveBeenCalledTimes(2)
  })

  it('appends inventory row when inventory payload is provided (filament)', async () => {
    mockReadRows.mockImplementation((_id: string, sheetName: string) => {
      if (sheetName === 'expenses') return Promise.resolve([])
      if (sheetName === 'transactions') return Promise.resolve([])
      if (sheetName === 'inventory') return Promise.resolve([])
      return Promise.resolve([])
    })

    await createExpense('spreadsheet-1', {
      date: '2025-01-23',
      category: 'filament',
      amount: 29.99,
      notes: 'PLA White',
      inventory: { type: 'filament', name: 'PLA White', quantity: 1000 },
    })

    expect(mockAppendRows).toHaveBeenCalledTimes(3)
    expect(mockAppendRows).toHaveBeenNthCalledWith(
      3,
      'spreadsheet-1',
      'inventory',
      [
        expect.objectContaining({
          id: 'INV1',
          expense_id: 'E1',
          type: 'filament',
          name: 'PLA White',
          qty_initial: 1000,
          qty_current: 1000,
        }),
      ]
    )
    const invCall = mockAppendRows.mock.calls[2][2][0] as {
      created_at: string
    }
    expect(invCall.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('appends inventory row for equipment type', async () => {
    mockReadRows.mockImplementation((_id: string, sheetName: string) => {
      if (sheetName === 'expenses') return Promise.resolve([{ id: 'E1' }])
      if (sheetName === 'transactions') return Promise.resolve([{ id: 'T1' }])
      if (sheetName === 'inventory')
        return Promise.resolve([{ id: 'INV1' }])
      return Promise.resolve([])
    })

    await createExpense('spreadsheet-1', {
      date: '2025-01-24',
      category: 'investment',
      amount: 350,
      notes: 'Ender 3',
      inventory: { type: 'equipment', name: 'Ender 3', quantity: 1 },
    })

    expect(mockAppendRows).toHaveBeenNthCalledWith(
      3,
      'spreadsheet-1',
      'inventory',
      [
        expect.objectContaining({
          id: 'INV2',
          expense_id: 'E2',
          type: 'equipment',
          name: 'Ender 3',
          qty_initial: 1,
          qty_current: 1,
        }),
      ]
    )
  })
})
