import { describe, it, expect } from 'vitest'
import { buildInventoryConsumptionRows } from './consumptionRows'
import type { Job, Piece, PieceItem } from '@/types/money'

describe('buildInventoryConsumptionRows', () => {
  it('joins piece items to pieces and jobs for inventory id', () => {
    const pieceItems: PieceItem[] = [
      {
        id: 'PI1',
        piece_id: 'P1',
        inventory_id: 'INV1',
        quantity: 42,
      },
    ]
    const pieces: Piece[] = [
      {
        id: 'P1',
        job_id: 'J1',
        name: 'Widget',
        status: 'done',
        created_at: '2025-03-01T12:00:00.000Z',
      },
    ]
    const jobs: Job[] = [
      {
        id: 'J1',
        client_id: 'CL1',
        description: 'Big job',
        status: 'paid',
        created_at: '2025-02-01',
      },
    ]

    const rows = buildInventoryConsumptionRows('INV1', pieceItems, pieces, jobs)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      pieceItemId: 'PI1',
      pieceId: 'P1',
      pieceName: 'Widget',
      jobId: 'J1',
      jobDescription: 'Big job',
      quantity: 42,
    })
  })

  it('ignores other inventory ids', () => {
    const rows = buildInventoryConsumptionRows(
      'INV9',
      [
        {
          id: 'PI1',
          piece_id: 'P1',
          inventory_id: 'INV1',
          quantity: 1,
        },
      ],
      [
        {
          id: 'P1',
          job_id: 'J1',
          name: 'W',
          status: 'pending',
          created_at: '2025-03-01',
        },
      ],
      []
    )
    expect(rows).toHaveLength(0)
  })
})
