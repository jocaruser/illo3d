import { describe, it, expect } from 'vitest'
import type { CrmNote, Job, Piece, TagLink } from '@/types/money'
import { tagNavigatePath } from '@/lib/globalSearch/tagNavigatePath'
import { selectGlobalSearchResults } from '@/lib/globalSearch/selectResults'
import { buildGlobalSearchRows } from '@/lib/globalSearch/buildRows'
import { bodyContainsQuery, extractNoteSnippet } from '@/lib/globalSearch/noteSnippet'

const t = (key: string) => key

describe('tagNavigatePath', () => {
  const links: TagLink[] = [
    {
      id: 'L1',
      tag_id: 'TG1',
      entity_type: 'job',
      entity_id: 'J1',
      created_at: '',
    },
    {
      id: 'L2',
      tag_id: 'TG1',
      entity_type: 'client',
      entity_id: 'CL1',
      created_at: '',
    },
  ]

  it('prefers /clients when any client link exists', () => {
    expect(tagNavigatePath(links, 'TG1')).toBe('/clients')
  })

  it('uses /jobs when only job links exist', () => {
    const jobOnly = links.filter((l) => l.entity_type === 'job')
    expect(tagNavigatePath(jobOnly, 'TG1')).toBe('/jobs')
  })

  it('defaults to /clients when no links', () => {
    expect(tagNavigatePath([], 'TG1')).toBe('/clients')
  })
})

describe('selectGlobalSearchResults', () => {
  const rows = buildGlobalSearchRows(
    {
      clients: [
        {
          id: 'CL1',
          name: 'Acme Corp',
          created_at: '2025-01-01',
        },
      ],
      jobs: [
        {
          id: 'J1',
          client_id: 'CL1',
          description: 'Other text',
          status: 'draft',
          created_at: '2025-01-01',
        } satisfies Job,
        {
          id: 'JZZ',
          client_id: 'CL1',
          description: 'JZZ description',
          status: 'draft',
          created_at: '2025-01-02',
        } satisfies Job,
      ],
      pieces: [
        {
          id: 'P1',
          job_id: 'J1',
          name: 'Bracket',
          status: 'pending',
          created_at: '2025-02-01',
        } satisfies Piece,
      ],
      crmNotes: [],
      transactions: [],
      inventory: [],
      tags: [],
      tagLinks: [],
    },
    t
  )

  it('returns no results when query is too short', () => {
    expect(selectGlobalSearchResults(rows, 'A')).toEqual([])
    expect(selectGlobalSearchResults(rows, '')).toEqual([])
  })

  it('ranks exact id before fuzzy matches', () => {
    const out = selectGlobalSearchResults(rows, 'JZZ')
    expect(out[0]?.kind).toBe('job')
    expect(out[0]?.id).toBe('JZZ')
  })

  it('caps at 10 results', () => {
    const manyClients = Array.from({ length: 15 }, (_, i) => ({
      id: `C${i}`,
      name: `SharedName ${i}`,
      created_at: '2025-01-01',
    }))
    const manyRows = buildGlobalSearchRows(
      {
        clients: manyClients,
        jobs: [],
        pieces: [],
        crmNotes: [],
        transactions: [],
        inventory: [],
        tags: [],
        tagLinks: [],
      },
      t
    )
    const out = selectGlobalSearchResults(manyRows, 'SharedName')
    expect(out.length).toBeLessThanOrEqual(10)
  })
})

describe('note snippets', () => {
  it('detects body substring for snippet eligibility', () => {
    expect(bodyContainsQuery('hello world', 'lo wo')).toBe(true)
    expect(bodyContainsQuery('hello', 'x')).toBe(false)
  })

  it('bounds snippet length', () => {
    const long = 'a'.repeat(200)
    const s = extractNoteSnippet(long, 'aaaa', 40)
    expect(s.length).toBeLessThanOrEqual(45)
  })
})

describe('CRM notes in global index', () => {
  const note: CrmNote = {
    id: 'CN1',
    entity_type: 'client',
    entity_id: 'CL1',
    body: 'Unique invoices by email phrase',
    referenced_entity_ids: '',
    severity: 'info',
    created_at: '2025-02-01',
  }

  it('finds note by body and attaches snippet', () => {
    const rows = buildGlobalSearchRows(
      {
        clients: [{ id: 'CL1', name: 'Beta', created_at: '2025-01-01' }],
        jobs: [],
        pieces: [],
        crmNotes: [note],
        transactions: [],
        inventory: [],
        tags: [],
        tagLinks: [],
      },
      t
    )
    const out = selectGlobalSearchResults(rows, 'invoices')
    expect(out.some((h) => h.kind === 'client_note' && h.snippet)).toBe(true)
  })
})
