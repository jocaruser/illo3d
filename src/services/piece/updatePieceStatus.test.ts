import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updatePieceStatus } from './updatePieceStatus'
import type { Inventory, Piece, PieceItem } from '@/types/money'

const mockUpdateRow = vi.fn()
const mockReadRows = vi.fn()

vi.mock('@/services/sheets/repository', () => ({
  getSheetsRepository: () => ({
    readRows: mockReadRows,
    updateRow: mockUpdateRow,
  }),
}))

const basePiece: Piece = {
  id: 'P1',
  job_id: 'J1',
  name: 'Shell',
  status: 'pending',
  created_at: '2025-01-01T00:00:00.000Z',
}

const inv1: Inventory = {
  id: 'INV1',
  expense_id: 'E1',
  type: 'filament',
  name: 'PLA',
  qty_initial: 1000,
  qty_current: 100,
  created_at: '2025-01-02T00:00:00.000Z',
}

function mockSheetsState(opts: {
  piece?: Piece
  lines?: PieceItem[]
  inventory?: Inventory[]
}) {
  const piece = opts.piece ?? basePiece
  const lines = opts.lines ?? []
  const inventory = opts.inventory ?? [inv1]
  mockReadRows.mockImplementation((_id: string, sheet: string) => {
    if (sheet === 'pieces') return Promise.resolve([piece])
    if (sheet === 'piece_items') return Promise.resolve(lines)
    if (sheet === 'inventory') return Promise.resolve(inventory)
    return Promise.resolve([])
  })
}

describe('updatePieceStatus', () => {
  beforeEach(() => {
    mockUpdateRow.mockReset()
    mockReadRows.mockReset()
  })

  it('decrements inventory and updates piece when marking done with decrement', async () => {
    mockSheetsState({
      lines: [
        {
          id: 'PI1',
          piece_id: 'P1',
          inventory_id: 'INV1',
          quantity: 40,
        },
      ],
      inventory: [{ ...inv1, qty_current: 100 }],
    })

    const result = await updatePieceStatus('s1', basePiece, 'done', {
      decrementInventory: true,
    })

    expect(result).toEqual({ ok: true })
    expect(mockUpdateRow).toHaveBeenCalledWith(
      's1',
      'inventory',
      1,
      expect.objectContaining({ id: 'INV1', qty_current: 60 })
    )
    expect(mockUpdateRow).toHaveBeenCalledWith(
      's1',
      'pieces',
      1,
      expect.objectContaining({ id: 'P1', status: 'done' })
    )
  })

  it('restores inventory when reverting done to pending with restore', async () => {
    const donePiece: Piece = { ...basePiece, status: 'done' }
    mockSheetsState({
      piece: donePiece,
      lines: [
        {
          id: 'PI1',
          piece_id: 'P1',
          inventory_id: 'INV1',
          quantity: 40,
        },
      ],
      inventory: [{ ...inv1, qty_current: 60 }],
    })

    const result = await updatePieceStatus('s1', donePiece, 'pending', {
      restoreInventory: true,
    })

    expect(result).toEqual({ ok: true })
    expect(mockUpdateRow).toHaveBeenCalledWith(
      's1',
      'inventory',
      1,
      expect.objectContaining({ id: 'INV1', qty_current: 100 })
    )
    expect(mockUpdateRow).toHaveBeenCalledWith(
      's1',
      'pieces',
      1,
      expect.objectContaining({ id: 'P1', status: 'pending' })
    )
  })

  it('returns insufficient_stock when decrement requested but stock too low', async () => {
    mockSheetsState({
      lines: [
        {
          id: 'PI1',
          piece_id: 'P1',
          inventory_id: 'INV1',
          quantity: 150,
        },
      ],
      inventory: [{ ...inv1, qty_current: 100 }],
    })

    const result = await updatePieceStatus('s1', basePiece, 'done', {
      decrementInventory: true,
    })

    expect(result).toEqual({
      ok: false,
      reason: 'insufficient_stock',
      lots: [{ inventoryId: 'INV1', need: 150, have: 100 }],
    })
    expect(mockUpdateRow).not.toHaveBeenCalled()
  })

  it('updates piece only when decrement is skipped', async () => {
    mockSheetsState({
      lines: [
        {
          id: 'PI1',
          piece_id: 'P1',
          inventory_id: 'INV1',
          quantity: 150,
        },
      ],
    })

    const result = await updatePieceStatus('s1', basePiece, 'done', {
      decrementInventory: false,
    })

    expect(result).toEqual({ ok: true })
    expect(mockUpdateRow).toHaveBeenCalledTimes(1)
    expect(mockUpdateRow).toHaveBeenCalledWith(
      's1',
      'pieces',
      1,
      expect.objectContaining({ status: 'done' })
    )
  })

  it('updates piece only when restore is skipped', async () => {
    const donePiece: Piece = { ...basePiece, status: 'done' }
    mockSheetsState({
      piece: donePiece,
      lines: [
        {
          id: 'PI1',
          piece_id: 'P1',
          inventory_id: 'INV1',
          quantity: 40,
        },
      ],
    })

    const result = await updatePieceStatus('s1', donePiece, 'pending', {
      restoreInventory: false,
    })

    expect(result).toEqual({ ok: true })
    expect(mockUpdateRow).toHaveBeenCalledTimes(1)
    expect(mockUpdateRow).toHaveBeenCalledWith(
      's1',
      'pieces',
      1,
      expect.objectContaining({ status: 'pending' })
    )
  })

  it('throws when piece is not found', async () => {
    mockReadRows.mockImplementation((_id: string, sheet: string) => {
      if (sheet === 'pieces') return Promise.resolve([])
      return Promise.resolve([])
    })

    await expect(
      updatePieceStatus('s1', basePiece, 'done', { decrementInventory: false })
    ).rejects.toThrow('Piece P1 not found')
  })

  it('throws when decrement requested with no lines', async () => {
    mockSheetsState({ lines: [] })

    await expect(
      updatePieceStatus('s1', basePiece, 'done', { decrementInventory: true })
    ).rejects.toThrow('no material lines')
  })

  it('reclassifies failed to done without touching inventory', async () => {
    const failedPiece: Piece = { ...basePiece, status: 'failed' }
    mockSheetsState({
      piece: failedPiece,
      lines: [
        {
          id: 'PI1',
          piece_id: 'P1',
          inventory_id: 'INV1',
          quantity: 40,
        },
      ],
    })

    const result = await updatePieceStatus('s1', failedPiece, 'done', {
      decrementInventory: true,
    })

    expect(result).toEqual({ ok: true })
    expect(mockUpdateRow).toHaveBeenCalledTimes(1)
    expect(mockUpdateRow).toHaveBeenCalledWith(
      's1',
      'pieces',
      1,
      expect.objectContaining({ status: 'done' })
    )
  })
})
