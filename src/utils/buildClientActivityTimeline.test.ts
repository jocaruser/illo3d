import { describe, expect, it } from 'vitest'
import {
  buildClientActivityTimeline,
  transactionDateToSortMs,
} from '@/utils/buildClientActivityTimeline'
import type {
  CrmNote,
  Job,
  Tag,
  TagLink,
  Transaction,
} from '@/types/money'

function note(p: Partial<CrmNote> & Pick<CrmNote, 'id' | 'entity_type' | 'entity_id'>): CrmNote {
  return {
    body: '',
    referenced_entity_ids: '',
    severity: 'info',
    created_at: '2025-01-01T00:00:00.000Z',
    ...p,
  }
}

describe('transactionDateToSortMs', () => {
  it('uses UTC start of day for YYYY-MM-DD', () => {
    expect(transactionDateToSortMs('2025-04-01')).toBe(
      Date.UTC(2025, 3, 1),
    )
  })

  it('parses full ISO strings', () => {
    const s = '2025-04-01T15:30:00.000Z'
    expect(transactionDateToSortMs(s)).toBe(Date.parse(s))
  })
})

describe('buildClientActivityTimeline', () => {
  const cl1 = 'CL1'
  const cl2 = 'CL2'

  const baseJob = (j: Partial<Job> & Pick<Job, 'id' | 'client_id'>): Job => ({
    description: 'Desc',
    status: 'draft',
    created_at: '2025-02-01T10:00:00.000Z',
    ...j,
  })

  it('excludes job notes that belong to another client', () => {
    const jobs = [
      baseJob({
        id: 'JX',
        client_id: cl2,
        created_at: '2025-01-01T10:00:00.000Z',
      }),
      baseJob({
        id: 'J1',
        client_id: cl1,
        created_at: '2025-01-02T10:00:00.000Z',
      }),
    ]
    const crmNotes: CrmNote[] = [
      note({
        id: 'N1',
        entity_type: 'job',
        entity_id: 'JX',
        body: 'wrong client',
        created_at: '2025-06-01T12:00:00.000Z',
      }),
      note({
        id: 'N2',
        entity_type: 'job',
        entity_id: 'J1',
        body: 'ok',
        created_at: '2025-06-02T12:00:00.000Z',
      }),
    ]
    const out = buildClientActivityTimeline({
      clientId: cl1,
      crmNotes,
      jobs,
      transactions: [],
      tags: [],
      tagLinks: [],
    })
    const jobNotes = out.filter((e) => e.kind === 'job_note')
    expect(jobNotes).toHaveLength(1)
    expect(jobNotes[0]?.body).toBe('ok')
  })

  it('excludes archived jobs and their notes', () => {
    const jobs: Job[] = [
      baseJob({
        id: 'J1',
        client_id: cl1,
        archived: 'true',
        created_at: '2025-03-01T10:00:00.000Z',
      }),
    ]
    const crmNotes: CrmNote[] = [
      note({
        id: 'N1',
        entity_type: 'job',
        entity_id: 'J1',
        body: 'on archived job',
        created_at: '2025-03-02T12:00:00.000Z',
      }),
    ]
    const out = buildClientActivityTimeline({
      clientId: cl1,
      crmNotes,
      jobs,
      transactions: [],
      tags: [],
      tagLinks: [],
    })
    expect(out.some((e) => e.kind === 'job_created')).toBe(false)
    expect(out.some((e) => e.kind === 'job_note')).toBe(false)
  })

  it('tie-breaks by kind priority then tieId when sortMs equal', () => {
    const same = '2025-05-01T12:00:00.000Z'
    const ms = Date.parse(same)
    const jobs: Job[] = [
      baseJob({
        id: 'Jz',
        client_id: cl1,
        description: 'Z',
        created_at: same,
      }),
      baseJob({
        id: 'Ja',
        client_id: cl1,
        description: 'A',
        created_at: same,
      }),
    ]
    const crmNotes: CrmNote[] = [
      note({
        id: 'CNb',
        entity_type: 'client',
        entity_id: cl1,
        body: 'b',
        created_at: same,
      }),
      note({
        id: 'CNa',
        entity_type: 'client',
        entity_id: cl1,
        body: 'a',
        created_at: same,
      }),
    ]
    const tagLinks: TagLink[] = [
      {
        id: 'TLb',
        tag_id: 'TG1',
        entity_type: 'client',
        entity_id: cl1,
        created_at: same,
      },
      {
        id: 'TLa',
        tag_id: 'TG1',
        entity_type: 'client',
        entity_id: cl1,
        created_at: same,
      },
    ]
    const transactions: Transaction[] = [
      {
        id: 'Tb',
        date: same,
        type: 'income',
        amount: 1,
        category: 'job',
        concept: 'b',
        ref_type: '',
        ref_id: '',
        client_id: cl1,
      },
      {
        id: 'Ta',
        date: same,
        type: 'income',
        amount: 2,
        category: 'job',
        concept: 'a',
        ref_type: '',
        ref_id: '',
        client_id: cl1,
      },
    ]
    const tags: Tag[] = [{ id: 'TG1', name: 'T', created_at: same }]

    const out = buildClientActivityTimeline({
      clientId: cl1,
      crmNotes,
      jobs,
      transactions,
      tags,
      tagLinks,
    })

    const allSameMs = out.every((e) => e.sortMs === ms)
    expect(allSameMs).toBe(true)

    const kinds = out.map((e) => e.kind)
    const firstIncome = kinds.indexOf('income')
    const firstTag = kinds.indexOf('tag')
    const firstClientNote = kinds.indexOf('client_note')
    const firstJobCreated = kinds.indexOf('job_created')
    expect(firstIncome).toBeLessThan(firstTag)
    expect(firstTag).toBeLessThan(firstClientNote)
    expect(firstClientNote).toBeLessThan(firstJobCreated)

    const incomes = out.filter((e) => e.kind === 'income')
    expect(incomes.map((e) => e.tieId).join(',')).toBe('Ta,Tb')
    const tagn = out.filter((e) => e.kind === 'tag')
    expect(tagn.map((e) => e.tieId).join(',')).toBe('TLa,TLb')
    const cnotes = out.filter((e) => e.kind === 'client_note')
    expect(cnotes.map((e) => e.tieId).join(',')).toBe('CNa,CNb')
    const jcreat = out.filter((e) => e.kind === 'job_created')
    expect(jcreat.map((e) => e.tieId).join(',')).toBe('Ja,Jz')
  })

  it('adds job income link when ref_type job', () => {
    const tx: Transaction = {
      id: 'T1',
      date: '2025-01-10',
      type: 'income',
      amount: 10,
      category: 'job',
      concept: 'Pay',
      ref_type: 'job',
      ref_id: 'J1',
      client_id: cl1,
    }
    const out = buildClientActivityTimeline({
      clientId: cl1,
      crmNotes: [],
      jobs: [baseJob({ id: 'J1', client_id: cl1 })],
      transactions: [tx],
      tags: [],
      tagLinks: [],
    })
    const inc = out.find((e) => e.kind === 'income')
    expect(inc?.kind === 'income' && inc.href).toBe('/jobs/J1')
    expect(inc?.kind === 'income' && inc.linkTestId).toBe(
      'transaction-concept-job-link-T1',
    )
  })
})
