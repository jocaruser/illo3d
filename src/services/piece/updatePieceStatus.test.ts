import { describe, it, expect, beforeEach } from 'vitest'
import { updatePieceStatus } from './updatePieceStatus'
import type { Inventory, Piece, PieceItem } from '@/types/money'
import { matrixToInventory, matrixToPieces } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

const basePiece: Piece = {
  id: 'P1',
  job_id: 'J1',
  name: 'Shell',
  status: 'pending',
  created_at: '2025-01-01T00:00:00.000Z',
}

const inv1: Inventory = {
  id: 'INV1',
  type: 'filament',
  name: 'PLA',
  qty_current: 100,
  warn_yellow: 0,
  warn_orange: 0,
  warn_red: 0,
  created_at: '2025-01-02T00:00:00.000Z',
}

function seedPieceFixture(opts: {
  piece?: Piece
  lines?: PieceItem[]
  inventory?: Inventory[]
}) {
  const piece = opts.piece ?? basePiece
  const lines = opts.lines ?? []
  const inventory = opts.inventory ?? [inv1]

  resetAndSeedWorkbook({
    pieces: matrixWithRows('pieces', [
      {
        id: piece.id,
        job_id: piece.job_id,
        name: piece.name,
        status: piece.status,
        price: piece.price ?? '',
        created_at: piece.created_at,
      },
    ]),
    piece_items: matrixWithRows(
      'piece_items',
      lines.map((l) => ({
        id: l.id,
        piece_id: l.piece_id,
        inventory_id: l.inventory_id,
        quantity: l.quantity,
      })),
    ),
    inventory: matrixWithRows(
      'inventory',
      inventory.map((i) => ({
        id: i.id,
        type: i.type,
        name: i.name,
        qty_current: i.qty_current,
        warn_yellow: i.warn_yellow,
        warn_orange: i.warn_orange,
        warn_red: i.warn_red,
        created_at: i.created_at,
      })),
    ),
  })
}

describe('updatePieceStatus', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('decrements inventory and updates piece when marking done with decrement', async () => {
    seedPieceFixture({
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
    expect(
      matrixToInventory(useWorkbookStore.getState().tabs.inventory)[0]
        ?.qty_current,
    ).toBe(60)
    expect(matrixToPieces(useWorkbookStore.getState().tabs.pieces)[0]?.status).toBe(
      'done',
    )
  })

  it('restores inventory when reverting done to pending with restore', async () => {
    const donePiece: Piece = { ...basePiece, status: 'done' }
    seedPieceFixture({
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
    expect(
      matrixToInventory(useWorkbookStore.getState().tabs.inventory)[0]
        ?.qty_current,
    ).toBe(100)
    expect(matrixToPieces(useWorkbookStore.getState().tabs.pieces)[0]?.status).toBe(
      'pending',
    )
  })

  it('returns insufficient_stock when decrement requested but stock too low', async () => {
    seedPieceFixture({
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
    expect(
      matrixToPieces(useWorkbookStore.getState().tabs.pieces)[0]?.status,
    ).toBe('pending')
  })

  it('updates piece only when decrement is skipped', async () => {
    seedPieceFixture({
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
    expect(
      matrixToInventory(useWorkbookStore.getState().tabs.inventory)[0]
        ?.qty_current,
    ).toBe(100)
    expect(matrixToPieces(useWorkbookStore.getState().tabs.pieces)[0]?.status).toBe(
      'done',
    )
  })

  it('updates piece only when restore is skipped', async () => {
    const donePiece: Piece = { ...basePiece, status: 'done' }
    seedPieceFixture({
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
    expect(
      matrixToInventory(useWorkbookStore.getState().tabs.inventory)[0]
        ?.qty_current,
    ).toBe(100)
    expect(matrixToPieces(useWorkbookStore.getState().tabs.pieces)[0]?.status).toBe(
      'pending',
    )
  })

  it('throws when piece is not found', async () => {
    resetAndSeedWorkbook({})

    await expect(
      updatePieceStatus('s1', basePiece, 'done', { decrementInventory: false }),
    ).rejects.toThrow('Piece P1 not found')
  })

  it('throws when decrement requested with no lines', async () => {
    seedPieceFixture({ lines: [] })

    await expect(
      updatePieceStatus('s1', basePiece, 'done', { decrementInventory: true }),
    ).rejects.toThrow('no material lines')
  })

  it('reclassifies failed to done without touching inventory', async () => {
    const failedPiece: Piece = { ...basePiece, status: 'failed' }
    seedPieceFixture({
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
    expect(
      matrixToInventory(useWorkbookStore.getState().tabs.inventory)[0]
        ?.qty_current,
    ).toBe(100)
    expect(matrixToPieces(useWorkbookStore.getState().tabs.pieces)[0]?.status).toBe(
      'done',
    )
  })
})
