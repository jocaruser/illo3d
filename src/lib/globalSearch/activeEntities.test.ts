import { describe, it, expect } from 'vitest'
import { excludeArchivedDeleted } from './activeEntities'
import { buildGlobalSearchRows } from './buildRows'
import { selectGlobalSearchResults } from './selectResults'
import type { Client } from '@/types/money'

const t = (key: string) => key

describe('excludeArchivedDeleted', () => {
  it('removes rows flagged archived or deleted', () => {
    const clients: Client[] = [
      { id: 'a', name: 'Active', created_at: '2025-01-01' },
      { id: 'b', name: 'Archived', created_at: '2025-01-01', archived: 'true' },
      { id: 'c', name: 'Gone', created_at: '2025-01-01', deleted: 'true' },
    ]
    const out = excludeArchivedDeleted(clients)
    expect(out.map((c) => c.id)).toEqual(['a'])
  })
})

describe('global search snapshot filtering', () => {
  it('does not index deleted clients for search', () => {
    const clients: Client[] = [
      { id: 'keep', name: 'Visible Co', created_at: '2025-01-01' },
      {
        id: 'drop',
        name: 'Hidden Co',
        created_at: '2025-01-01',
        deleted: 'true',
      },
    ]
    const filtered = excludeArchivedDeleted(clients)
    const rows = buildGlobalSearchRows(
      {
        clients: filtered,
        jobs: [],
        pieces: [],
        crmNotes: [],
        transactions: [],
        expenses: [],
        inventory: [],
        tags: [],
        tagLinks: [],
      },
      t,
    )
    expect(selectGlobalSearchResults(rows, 'Hidden')).toEqual([])
    expect(
      selectGlobalSearchResults(rows, 'Visible').some((h) => h.id === 'keep'),
    ).toBe(true)
  })
})
