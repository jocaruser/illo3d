import { describe, expect, it } from 'vitest'
import { parseCsv, serializeCsv } from '@/Repository/LocalCsv/Csv'

describe('parseCsv', () => {
  it('parses plain rows separated by LF', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('tolerates CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('tolerates lone CR line endings', () => {
    expect(parseCsv('a,b\r1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('returns no rows for empty text', () => {
    expect(parseCsv('')).toEqual([])
  })

  it('ignores a trailing newline', () => {
    expect(parseCsv('a,b\n')).toEqual([['a', 'b']])
  })

  it('parses a single newline as one empty row', () => {
    expect(parseCsv('\n')).toEqual([['']])
  })

  it('keeps a trailing empty cell', () => {
    expect(parseCsv('a,')).toEqual([['a', '']])
  })

  it('parses quoted fields with embedded commas', () => {
    expect(parseCsv('"a,b",c')).toEqual([['a,b', 'c']])
  })

  it('unescapes doubled quotes inside quoted fields', () => {
    expect(parseCsv('"he said ""hi""",x')).toEqual([['he said "hi"', 'x']])
  })

  it('keeps newlines inside quoted fields', () => {
    expect(parseCsv('"line1\nline2",x\ny,z')).toEqual([
      ['line1\nline2', 'x'],
      ['y', 'z'],
    ])
  })

  it('keeps CRLF inside quoted fields verbatim', () => {
    expect(parseCsv('"a\r\nb",c')).toEqual([['a\r\nb', 'c']])
  })
})

describe('serializeCsv', () => {
  it('serializes an empty matrix to empty text', () => {
    expect(serializeCsv([])).toBe('')
  })

  it('joins plain cells with commas and CRLF row endings', () => {
    expect(
      serializeCsv([
        ['a', 'b'],
        ['1', '2'],
      ])
    ).toBe('a,b\r\n1,2\r\n')
  })

  it('quotes cells containing commas, quotes or newlines', () => {
    expect(serializeCsv([['a,b', 'say "hi"', 'l1\nl2', 'plain']])).toBe(
      '"a,b","say ""hi""","l1\nl2",plain\r\n'
    )
  })
})

describe('round-trip', () => {
  const trickyCells = [
    '{"a":"x,y","b":"he said \\"hi\\""}',
    JSON.stringify({ before: { note: 'line1\nline2' }, after: null }),
    'plain',
    '',
    'comma,inside',
    '"leading quote',
    'trailing quote"',
    'crlf\r\ninside',
    'lone\rcr',
    '  padded  ',
  ]

  it('round-trips every tricky cell', () => {
    for (const cell of trickyCells) {
      expect(parseCsv(serializeCsv([[cell]]))).toEqual([[cell]])
    }
  })

  it('round-trips a matrix mixing all tricky cells', () => {
    const matrix = [trickyCells, [...trickyCells].reverse()]
    expect(parseCsv(serializeCsv(matrix))).toEqual(matrix)
  })

  it('round-trips an audit_log style row with JSON snapshots', () => {
    const row = [
      'AL1',
      '2026-01-01T00:00:00Z',
      'user@example.com',
      'client',
      'CL1',
      'update',
      '{"name":"Acme, Inc.","notes":"said \\"ok\\"\nthen left"}',
      '{"name":"Acme"}',
      'name,notes',
      '',
      '',
    ]
    expect(parseCsv(serializeCsv([row]))).toEqual([row])
  })
})
