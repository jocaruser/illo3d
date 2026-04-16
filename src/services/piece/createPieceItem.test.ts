import { describe, it, expect, beforeEach } from 'vitest'
import { createPieceItem } from './createPieceItem'
import { matrixToPieceItems } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('createPieceItem', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('appends piece_item with PI1 id', async () => {
    resetAndSeedWorkbook({})

    await createPieceItem('spreadsheet-1', {
      piece_id: 'P1',
      inventory_id: 'INV1',
      quantity: 12.5,
    })

    const lines = matrixToPieceItems(
      useWorkbookStore.getState().tabs.piece_items,
    )
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({
      id: 'PI1',
      piece_id: 'P1',
      inventory_id: 'INV1',
      quantity: 12.5,
    })
  })

  it('increments line id when piece_items exist', async () => {
    resetAndSeedWorkbook({
      piece_items: matrixWithRows('piece_items', [
        {
          id: 'PI1',
          piece_id: 'P1',
          inventory_id: 'INV1',
          quantity: '1',
        },
      ]),
    })

    await createPieceItem('spreadsheet-1', {
      piece_id: 'P2',
      inventory_id: 'INV2',
      quantity: 1,
    })

    expect(
      matrixToPieceItems(
        useWorkbookStore.getState().tabs.piece_items,
      ).find((l) => l.id === 'PI2'),
    ).toMatchObject({
      piece_id: 'P2',
      inventory_id: 'INV2',
      quantity: 1,
    })
  })
})
