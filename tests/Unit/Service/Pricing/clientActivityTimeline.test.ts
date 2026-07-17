import { describe, expect, it } from 'vitest'
import { buildClientActivityTimeline } from '@/Service/Pricing/clientActivityTimeline'
import { makeEm } from '../helpers'

function seeded() {
  const context = makeEm()
  const { tabs } = context
  tabs.seed('clients', { id: 'CL1', name: 'Acme' })
  tabs.seed('jobs', {
    id: 'J1',
    client_id: 'CL1',
    description: 'Lamp',
    status: 'draft',
    created_at: '2026-01-02T00:00:00.000Z',
  })
  tabs.seed('crm_notes', {
    id: 'CN1',
    entity_type: 'client',
    entity_id: 'CL1',
    body: 'client note',
    severity: 'warning',
    created_at: '2026-01-03T00:00:00.000Z',
  })
  tabs.seed('crm_notes', {
    id: 'JN1',
    entity_type: 'job',
    entity_id: 'J1',
    body: 'job note',
    severity: 'info',
    created_at: '2026-01-04T00:00:00.000Z',
  })
  tabs.seed('transactions', {
    id: 'T1',
    type: 'income',
    client_id: 'CL1',
    amount: '25',
    concept: ' payment ',
    date: '2026-01-05',
  })
  tabs.seed('tags', { id: 'TG1', name: ' Vip ' })
  tabs.seed('tag_links', {
    id: 'TL1',
    tag_id: 'TG1',
    entity_type: 'client',
    entity_id: 'CL1',
    created_at: '2026-01-01T00:00:00.000Z',
  })
  return context
}

describe('buildClientActivityTimeline', () => {
  it('merges every source, newest first, with per-kind payloads', () => {
    const { em } = seeded()
    const entries = buildClientActivityTimeline(em, 'CL1')
    expect(entries.map((entry) => entry.kind)).toEqual([
      'income',
      'job_note',
      'client_note',
      'job_created',
      'tag',
    ])
    expect(entries[0]).toEqual({
      kind: 'income',
      id: 'income-T1',
      at: '2026-01-05',
      transactionId: 'T1',
      amount: 25,
      concept: 'payment',
    })
    expect(entries[1]).toMatchObject({
      kind: 'job_note',
      noteId: 'JN1',
      jobId: 'J1',
      jobDescription: 'Lamp',
      body: 'job note',
      severity: 'info',
    })
    expect(entries[2]).toMatchObject({ kind: 'client_note', noteId: 'CN1', severity: 'warning' })
    expect(entries[3]).toMatchObject({ kind: 'job_created', jobId: 'J1', status: 'draft' })
    expect(entries[4]).toEqual({
      kind: 'tag',
      id: 'tag-TL1',
      at: '2026-01-01T00:00:00.000Z',
      linkId: 'TL1',
      tagId: 'TG1',
      tagName: 'Vip',
    })
  })

  it('breaks time ties by kind priority then id', () => {
    const { em, tabs } = makeEm()
    const at = '2026-01-02T00:00:00.000Z'
    tabs.seed('jobs', { id: 'J1', client_id: 'CL1', status: 'draft', created_at: at })
    tabs.seed('crm_notes', {
      id: 'CN1',
      entity_type: 'client',
      entity_id: 'CL1',
      body: 'x',
      created_at: at,
    })
    tabs.seed('transactions', {
      id: 'T1',
      type: 'income',
      client_id: 'CL1',
      amount: '1',
      date: at,
    })
    tabs.seed('tag_links', {
      id: 'TL1',
      tag_id: 'TG9',
      entity_type: 'client',
      entity_id: 'CL1',
      created_at: at,
    })
    tabs.seed('crm_notes', {
      id: 'JN1',
      entity_type: 'job',
      entity_id: 'J1',
      body: 'y',
      created_at: at,
    })
    const entries = buildClientActivityTimeline(em, 'CL1')
    expect(entries.map((entry) => entry.kind)).toEqual([
      'income',
      'tag',
      'job_note',
      'client_note',
      'job_created',
    ])
    // Unknown tag falls back to its id as the name.
    expect(entries[1]).toMatchObject({ kind: 'tag', tagName: 'TG9' })
  })

  it('breaks identical kind+time ties by entity id', () => {
    const { em, tabs } = makeEm()
    const at = '2026-01-02T00:00:00.000Z'
    tabs.seed('crm_notes', {
      id: 'CN2',
      entity_type: 'client',
      entity_id: 'CL1',
      body: 'b',
      created_at: at,
    })
    tabs.seed('crm_notes', {
      id: 'CN1',
      entity_type: 'client',
      entity_id: 'CL1',
      body: 'a',
      created_at: at,
    })
    const entries = buildClientActivityTimeline(em, 'CL1')
    expect(entries.map((entry) => entry.id)).toEqual(['client_note-CN1', 'client_note-CN2'])
  })

  it('shows only active rows scoped to the client', () => {
    const { em, tabs } = seeded()
    tabs.seed('jobs', { id: 'J2', client_id: 'CL1', status: 'draft', deleted: 'true' })
    tabs.seed('crm_notes', {
      id: 'CN9',
      entity_type: 'client',
      entity_id: 'CL1',
      body: 'gone',
      archived: 'true',
    })
    tabs.seed('crm_notes', { id: 'JN9', entity_type: 'job', entity_id: 'J2', body: 'orphan' })
    tabs.seed('transactions', { id: 'T9', type: 'expense', client_id: 'CL1', amount: '-1' })
    tabs.seed('transactions', { id: 'T8', type: 'income', client_id: 'CL2', amount: '1' })
    tabs.seed('tag_links', { id: 'TL9', tag_id: 'TG1', entity_type: 'job', entity_id: 'J1' })
    const entries = buildClientActivityTimeline(em, 'CL1')
    expect(entries.map((entry) => entry.id)).toEqual([
      'income-T1',
      'job_note-JN1',
      'client_note-CN1',
      'job_created-J1',
      'tag-TL1',
    ])
  })

  it('falls back to the job id when the description is blank and 0 for bad dates', () => {
    const { em, tabs } = makeEm()
    tabs.seed('jobs', {
      id: 'J1',
      client_id: 'CL1',
      description: '  ',
      status: 'draft',
      created_at: 'garbage',
    })
    tabs.seed('transactions', {
      id: 'T1',
      type: 'income',
      client_id: 'CL1',
      amount: '',
      date: '2026-01-05',
    })
    tabs.seed('tags', { id: 'TG1', name: '   ' })
    tabs.seed('tag_links', {
      id: 'TL1',
      tag_id: 'TG1',
      entity_type: 'client',
      entity_id: 'CL1',
      created_at: '2026-01-04T00:00:00.000Z',
    })
    const entries = buildClientActivityTimeline(em, 'CL1')
    expect(entries[0]).toMatchObject({ kind: 'income', amount: 0 })
    // Blank tag names fall back to the tag id.
    expect(entries[1]).toMatchObject({ kind: 'tag', tagName: 'TG1' })
    expect(entries[2]).toMatchObject({ kind: 'job_created', jobDescription: 'J1' })
  })
})
