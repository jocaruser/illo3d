import { describe, it, expect } from 'vitest'
import { SHEET_HEADERS } from '@/services/sheets/config'
import { migratePiecesMatrixFromDiskSnapshot } from './ensureLocalPiecesCsvCanonical'

describe('migratePiecesMatrixFromDiskSnapshot', () => {
  it('rewrites legacy pieces matrix missing units column before created_at', () => {
    const legacy: string[][] = [
      ['id', 'job_id', 'name', 'status', 'price', 'created_at', 'archived', 'deleted'],
      ['P1', 'J1', 'Part', 'pending', '10', '2025-01-01', '', ''],
    ]
    const migrated = migratePiecesMatrixFromDiskSnapshot(legacy)
    expect(migrated).not.toBeNull()
    expect(migrated![0]).toEqual(SHEET_HEADERS.pieces.map(String))
    expect(migrated![1][SHEET_HEADERS.pieces.indexOf('units')]).toBe('')
    expect(migrated![1][SHEET_HEADERS.pieces.indexOf('price')]).toBe('10')
    expect(migrated![1][SHEET_HEADERS.pieces.indexOf('created_at')]).toBe('2025-01-01')
  })

  it('returns null when already canonical', () => {
    const canon: string[][] = [
      SHEET_HEADERS.pieces.map(String),
      ['P1', 'J1', 'Part', 'pending', '10', '', '2025-01-01', '', ''],
    ]
    expect(migratePiecesMatrixFromDiskSnapshot(canon)).toBeNull()
  })
})
