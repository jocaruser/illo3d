import { describe, it, expect } from 'vitest'
import { parseCsvLine } from './sheetMatrix'

describe('parseCsvLine', () => {
  it('splits simple comma-separated values', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('handles quoted values with commas', () => {
    expect(parseCsvLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd'])
  })

  it('handles escaped quotes inside quoted values', () => {
    expect(parseCsvLine('a,"b""c",d')).toEqual(['a', 'b"c', 'd'])
  })

  it('handles empty trailing fields', () => {
    expect(parseCsvLine('a,b,')).toEqual(['a', 'b', ''])
  })

  it('trims unquoted whitespace', () => {
    expect(parseCsvLine(' a , b , c ')).toEqual(['a', 'b', 'c'])
  })
})
