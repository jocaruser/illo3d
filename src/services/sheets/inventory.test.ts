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
        type: 'filament',
        name: 'PLA',
        qty_current: '90',
        warn_yellow: '0',
        warn_orange: '0',
        warn_red: '0',
        created_at: '2025-03-20T12:00:00.000Z',
      },
      {
        id: 'INV2',
        type: 'equipment',
        name: 'Printer',
        qty_current: 1,
        warn_yellow: 300,
        warn_orange: 100,
        warn_red: 10,
        created_at: '2025-03-25T12:00:00.000Z',
      },
    ])

    const rows = await fetchInventory('sheet-1')

    expect(mockReadRows).toHaveBeenCalledWith('sheet-1', 'inventory')
    expect(rows).toHaveLength(2)
    expect(rows[0].id).toBe('INV2')
    expect(rows[1].id).toBe('INV1')
    expect(rows[1].qty_current).toBe(90)
    expect(rows[0].warn_orange).toBe(100)
  })

  it('filters rows missing required fields', async () => {
    mockReadRows.mockResolvedValue([
      {
        id: '',
        type: 'filament',
        name: 'X',
        qty_current: 1,
        warn_yellow: 0,
        warn_orange: 0,
        warn_red: 0,
        created_at: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'INV1',
        type: 'filament',
        name: 'Y',
        qty_current: 1,
        warn_yellow: 0,
        warn_orange: 0,
        warn_red: 0,
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
