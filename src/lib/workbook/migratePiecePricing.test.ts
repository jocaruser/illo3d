import { describe, it, expect } from 'vitest'
import { applyPiecePricingMigrations, ensureAllSheets } from './migratePiecePricing'
import { matrixToJobs, matrixToPieces } from '@/lib/workbook/workbookEntities'
import { SHEET_HEADERS } from '@/services/sheets/config'

describe('applyPiecePricingMigrations', () => {
  it('normalizes pieces header to include price column', () => {
    const tabs = ensureAllSheets({
      pieces: [
        ['id', 'job_id', 'name', 'status', 'created_at', 'archived', 'deleted'],
        ['P1', 'J1', 'A', 'pending', '2025-01-01', '', ''],
      ],
    })
    const { tabs: next, modified } = applyPiecePricingMigrations(tabs)
    expect(modified).toBe(true)
    expect(next.pieces?.[0]).toEqual(SHEET_HEADERS.pieces.map(String))
    expect(matrixToPieces(next.pieces)[0]).toMatchObject({
      id: 'P1',
      job_id: 'J1',
    })
    expect(matrixToPieces(next.pieces)[0].price).toBeUndefined()
  })

  it('copies legacy job price onto first counting piece and clears job price', () => {
    const tabs = ensureAllSheets({
      jobs: [
        SHEET_HEADERS.jobs.map(String),
        ['J1', 'CL1', 'Job', 'delivered', '35.5', '', '2025-01-01', '', ''],
      ],
      pieces: [
        SHEET_HEADERS.pieces.map(String),
        ['P1', 'J1', 'Part', 'pending', '', '', '2025-01-01', '', ''],
      ],
    })
    const { tabs: next, modified } = applyPiecePricingMigrations(tabs)
    expect(modified).toBe(true)
    expect(matrixToPieces(next.pieces)[0].price).toBe(35.5)
    expect(matrixToJobs(next.jobs)[0]?.price).toBeUndefined()
  })

  it('does not overwrite piece prices when legacy job price exists', () => {
    const tabs = ensureAllSheets({
      jobs: [
        SHEET_HEADERS.jobs.map(String),
        ['J1', 'CL1', 'Job', 'delivered', '99', '', '2025-01-01', '', ''],
      ],
      pieces: [
        SHEET_HEADERS.pieces.map(String),
        ['P1', 'J1', 'Part', 'pending', '12', '', '2025-01-01', '', ''],
      ],
    })
    const { tabs: next, modified } = applyPiecePricingMigrations(tabs)
    expect(matrixToPieces(next.pieces)[0].price).toBe(12)
    expect(matrixToJobs(next.jobs)[0]?.price).toBe(99)
    expect(modified).toBe(false)
  })
})
