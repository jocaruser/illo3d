import { describe, it, expect } from 'vitest'
import { filterRowsBySearchQuery } from '@/lib/listTable/fuzzyFilter'
import { sortRowsByColumn, compareWithStableIdTiebreak } from '@/lib/listTable/sortDiscovery'
import { moneySearchFragments, joinSearchParts } from '@/lib/listTable/moneySearchFragments'
import {
  buildClientSearchBlob,
  buildJobSearchBlob,
  buildTransactionSearchBlob,
  buildPieceSearchBlob,
} from '@/lib/listTable/searchBlobs'
import type { Client, Job, Transaction, Piece } from '@/types/money'

describe('filterRowsBySearchQuery', () => {
  it('returns all rows when query is empty', () => {
    const rows = [{ id: '1', blob: 'hello world' }]
    expect(filterRowsBySearchQuery(rows, '', (r) => r.blob)).toEqual(rows)
  })

  it('returns all rows when query has one character (B4)', () => {
    const rows = [{ id: '1', blob: 'Acme Corp' }]
    expect(filterRowsBySearchQuery(rows, 'A', (r) => r.blob)).toEqual(rows)
    expect(filterRowsBySearchQuery(rows, ' x ', (r) => r.blob)).toEqual(rows)
  })

  it('matches ISO date month fragment (A1)', () => {
    const rows = [{ id: '1', blob: '2026-06-15 other' }]
    expect(filterRowsBySearchQuery(rows, '2026-06', (r) => r.blob)).toEqual(rows)
  })

  it('does not match different month (A3)', () => {
    const rows = [{ id: '1', blob: '2026-06-15' }]
    expect(filterRowsBySearchQuery(rows, '2026-05', (r) => r.blob)).toEqual([])
  })

  it('matches fuzzy typo (B1)', () => {
    const rows = [{ id: '1', blob: 'Acme Corp extra' }]
    const out = filterRowsBySearchQuery(rows, 'Acme Coorp', (r) => r.blob)
    expect(out).toEqual(rows)
  })

  it('does not match high-edit-distance noise (B3)', () => {
    const rows = [{ id: '1', blob: 'Acme Corp' }]
    expect(filterRowsBySearchQuery(rows, 'Xmee', (r) => r.blob)).toEqual([])
  })

  it('finds row by hidden field only (C1-style)', () => {
    const rows = [
      { id: '1', blob: 'visible only' },
      { id: '2', blob: 'other invoice PDF hidden' },
    ]
    expect(filterRowsBySearchQuery(rows, 'invoice PDF', (r) => r.blob)).toEqual([
      rows[1],
    ])
  })
})

describe('moneySearchFragments', () => {
  it('includes dot and comma decimals (D1 D2)', () => {
    const parts = moneySearchFragments(123.45)
    expect(parts.some((p) => p.includes('123.45'))).toBe(true)
    expect(parts.some((p) => p.includes('123,45'))).toBe(true)
  })

  it('includes integer trailing zero forms (D3)', () => {
    const parts = moneySearchFragments(100)
    expect(parts).toContain('100')
    expect(parts).toContain('100.00')
    expect(parts).toContain('100,00')
  })
})

describe('buildTransactionSearchBlob', () => {
  it('includes notes and ref fields for hidden search', () => {
    const tx: Transaction = {
      id: 'T1',
      date: '2026-06-01',
      type: 'income',
      amount: 50,
      category: 'job',
      concept: 'Payment',
      ref_type: 'job',
      ref_id: 'J42',
      notes: 'secret memo',
    }
    const blob = buildTransactionSearchBlob(tx, {
      typeLabel: 'Ingreso',
      clientLabel: '',
    })
    expect(blob).toContain('secret memo')
    expect(blob).toContain('J42')
    expect(blob).toContain('Ingreso')
    expect(blob).toContain('income')
  })
})

describe('buildJobSearchBlob', () => {
  it('includes client_id and resolved name', () => {
    const job: Job = {
      id: 'J1',
      client_id: 'cli-zzz',
      description: 'Part',
      status: 'draft',
      created_at: '2026-01-01',
    }
    const blob = buildJobSearchBlob(job, {
      clientName: 'Acme',
      statusLabel: 'Draft',
    })
    expect(blob).toContain('cli-zzz')
    expect(blob).toContain('Acme')
  })
})

describe('buildPieceSearchBlob', () => {
  it('includes job_id for F1', () => {
    const piece: Piece = {
      id: 'P1',
      job_id: 'job-7',
      name: 'Bracket',
      status: 'pending',
      created_at: '2026-02-01',
    }
    const blob = buildPieceSearchBlob(piece, {
      jobLabel: 'job-7 — x',
      statusLabel: 'Pending',
    })
    expect(blob).toContain('job-7')
  })
})

describe('buildClientSearchBlob', () => {
  it('joins all client fields', () => {
    const c: Client = {
      id: 'CL1',
      name: 'Acme',
      email: 'e@e.com',
      phone: '1',
      notes: 'n',
      created_at: '2026-03-01',
    }
    const blob = buildClientSearchBlob(c)
    expect(blob).toContain('CL1')
    expect(blob).toContain('Acme')
    expect(blob).toContain('2026-03-01')
  })
})

describe('sortRowsByColumn', () => {
  it('uses id as stable tiebreak', () => {
    const rows = [
      { id: 'b', v: 1 },
      { id: 'a', v: 1 },
    ]
    const sorted = sortRowsByColumn(
      rows,
      (r) => r.id,
      'v',
      'asc',
      (r) => r.v
    )
    expect(sorted.map((r) => r.id)).toEqual(['a', 'b'])
  })
})

describe('compareWithStableIdTiebreak', () => {
  it('breaks ties with id', () => {
    expect(compareWithStableIdTiebreak(1, 1, 'asc', 'a', 'b')).toBeLessThan(0)
    expect(compareWithStableIdTiebreak(1, 1, 'asc', 'b', 'a')).toBeGreaterThan(0)
  })
})

describe('joinSearchParts', () => {
  it('skips empty chunks', () => {
    expect(joinSearchParts(['a', '', undefined, null, 'b'])).toContain('a')
    expect(joinSearchParts(['a', '', undefined, null, 'b'])).toContain('b')
  })
})
