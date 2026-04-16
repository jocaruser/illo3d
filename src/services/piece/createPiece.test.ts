import { describe, it, expect, beforeEach } from 'vitest'
import { createPiece } from './createPiece'
import { matrixToPieces } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('createPiece', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('appends piece with P1 id and pending status', async () => {
    resetAndSeedWorkbook({})

    await createPiece('spreadsheet-1', {
      job_id: 'J1',
      name: 'Lid',
    })

    const pieces = matrixToPieces(useWorkbookStore.getState().tabs.pieces)
    expect(pieces).toHaveLength(1)
    expect(pieces[0]).toMatchObject({
      id: 'P1',
      job_id: 'J1',
      name: 'Lid',
      status: 'pending',
    })
    expect(pieces[0].created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('increments piece id when pieces exist', async () => {
    resetAndSeedWorkbook({
      pieces: matrixWithRows('pieces', [
        {
          id: 'P1',
          job_id: 'J1',
          name: 'a',
          status: 'pending',
          created_at: '2025-01-01',
        },
        {
          id: 'P2',
          job_id: 'J1',
          name: 'b',
          status: 'pending',
          created_at: '2025-01-02',
        },
      ]),
    })

    await createPiece('spreadsheet-1', {
      job_id: 'J2',
      name: 'Next',
    })

    expect(
      matrixToPieces(useWorkbookStore.getState().tabs.pieces).find(
        (p) => p.id === 'P3',
      )?.name,
    ).toBe('Next')
  })
})
