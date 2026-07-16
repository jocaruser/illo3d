import { describe, expect, it } from 'vitest'
import { PIECE_STATUSES, Piece, parsePieceStatus } from '@/Entity/Piece'

const record = {
  id: 'P1',
  job_id: 'J1',
  name: 'Shell',
  status: 'done',
  price: '5',
  units: '2',
  created_at: '2026-01-01T00:00:00.000Z',
  archived: 'true',
  deleted: '',
}

describe('Piece', () => {
  it('round-trips fromRecord/toRecord', () => {
    const piece = Piece.fromRecord(record)
    expect(piece.status).toBe('done')
    expect(piece.price).toBe(5)
    expect(piece.units).toBe(2)
    expect(piece.toRecord()).toEqual(record)
  })

  it('defaults missing cells', () => {
    const piece = Piece.fromRecord({})
    expect(piece.status).toBe('pending')
    expect(piece.price).toBeUndefined()
    expect(piece.units).toBeUndefined()
    expect(piece.toRecord().units).toBe('')
  })

  it('parsePieceStatus falls back to pending', () => {
    for (const status of PIECE_STATUSES) expect(parsePieceStatus(status)).toBe(status)
    expect(parsePieceStatus('nope')).toBe('pending')
  })

  it('isConsuming for done and failed only', () => {
    const piece = new Piece()
    expect(piece.isConsuming()).toBe(false)
    piece.status = 'done'
    expect(piece.isConsuming()).toBe(true)
    piece.status = 'failed'
    expect(piece.isConsuming()).toBe(true)
  })

  it('hasValidUnits requires a positive integer', () => {
    const piece = new Piece()
    expect(piece.hasValidUnits()).toBe(false)
    piece.units = 0
    expect(piece.hasValidUnits()).toBe(false)
    piece.units = 1.5
    expect(piece.hasValidUnits()).toBe(false)
    piece.units = 3
    expect(piece.hasValidUnits()).toBe(true)
  })

  it('isPriced needs a price (0 allowed) and valid units', () => {
    const piece = new Piece()
    piece.units = 2
    expect(piece.isPriced()).toBe(false)
    piece.price = 0
    expect(piece.isPriced()).toBe(true)
    piece.units = undefined
    expect(piece.isPriced()).toBe(false)
  })

  it('lineTotal is price × units, undefined while unpriced', () => {
    const piece = new Piece()
    expect(piece.lineTotal()).toBeUndefined()
    piece.price = 4
    piece.units = 3
    expect(piece.lineTotal()).toBe(12)
  })
})
