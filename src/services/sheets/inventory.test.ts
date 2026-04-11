import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchInventory, formatInventoryCreatedDate } from './inventory'

const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
  }),
}))

describe('fetchInventory', () => {
  beforeEach(() => {
    mockReadRows.mockReset()
  })

  it('parses numeric fields and sorts by created_at descending', async () => {
    mockReadRows.mockResolvedValue([
      {
        id: 'INV1',
        expense_id: 'E1',
        type: 'filament',
        name: 'PLA',
        qty_initial: '100',
        qty_current: '90',
        created_at: '2025-03-20T12:00:00.000Z',
      },
      {
        id: 'INV2',
        expense_id: 'E2',
        type: 'equipment',
        name: 'Printer',
        qty_initial: 1,
        qty_current: 1,
        created_at: '2025-03-25T12:00:00.000Z',
      },
    ])

    const rows = await fetchInventory('sheet-1')

    expect(mockReadRows).toHaveBeenCalledWith('sheet-1', 'inventory')
    expect(rows).toHaveLength(2)
    expect(rows[0].id).toBe('INV2')
    expect(rows[1].id).toBe('INV1')
    expect(rows[1].qty_initial).toBe(100)
    expect(rows[1].qty_current).toBe(90)
  })

  it('filters rows missing required fields', async () => {
    mockReadRows.mockResolvedValue([
      {
        id: '',
        expense_id: 'E1',
        type: 'filament',
        name: 'X',
        qty_initial: 1,
        qty_current: 1,
        created_at: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'INV1',
        expense_id: 'E1',
        type: 'filament',
        name: 'Y',
        qty_initial: 1,
        qty_current: 1,
        created_at: '2025-01-01T00:00:00.000Z',
      },
    ])

    const rows = await fetchInventory('sheet-1')
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe('INV1')
  })
})

describe('formatInventoryCreatedDate', () => {
  it('returns YYYY-MM-DD for valid ISO strings', () => {
    expect(formatInventoryCreatedDate('2025-03-25T12:00:00.000Z')).toBe(
      '2025-03-25'
    )
  })
})
