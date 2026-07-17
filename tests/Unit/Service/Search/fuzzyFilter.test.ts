import { describe, expect, it } from 'vitest'
import { fuzzyFilter } from '@/Service/Search/fuzzyFilter'

interface Row {
  id: string
  blob: string
}

const rows: Row[] = [
  { id: 'a', blob: 'Acme Corporation lamp order 2026-01-15' },
  { id: 'b', blob: 'Bracket piece PLA red' },
  { id: 'c', blob: 'Consulting invoice 2026-02-01' },
]

const getBlob = (row: Row) => row.blob

describe('fuzzyFilter', () => {
  it('passes rows through for queries shorter than 2 characters', () => {
    expect(fuzzyFilter(rows, '', getBlob)).toBe(rows)
    expect(fuzzyFilter(rows, ' a ', getBlob)).toBe(rows)
  })

  it('matches fuzzily, best match first, and tolerates small typos', () => {
    expect(fuzzyFilter(rows, 'acme', getBlob)[0]?.id).toBe('a')
    expect(fuzzyFilter(rows, 'bracet', getBlob)[0]?.id).toBe('b')
  })

  it('returns nothing for unrelated queries', () => {
    expect(fuzzyFilter(rows, 'zzzzzz', getBlob)).toEqual([])
  })

  it('uses literal substring matching for YYYY-MM queries', () => {
    expect(fuzzyFilter(rows, '2026-01', getBlob).map((row) => row.id)).toEqual(['a'])
    expect(fuzzyFilter(rows, '2026-02', getBlob).map((row) => row.id)).toEqual(['c'])
  })

  it('uses literal substring matching for YYYY-MM-DD queries', () => {
    expect(fuzzyFilter(rows, '2026-01-15', getBlob).map((row) => row.id)).toEqual(['a'])
    expect(fuzzyFilter(rows, '2026-01-16', getBlob)).toEqual([])
  })
})
