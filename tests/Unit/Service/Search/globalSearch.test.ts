import { describe, expect, it } from 'vitest'
import { GLOBAL_SEARCH_MAX_RESULTS, globalSearch } from '@/Service/Search/globalSearch'
import { makeEm, type TestContext } from '../helpers'

const t = (key: string) => key

function seeded(): TestContext {
  const context = makeEm()
  const { tabs } = context
  tabs.seed('clients', { id: 'CL1', name: 'Acme Corp', email: 'a@b.c' })
  tabs.seed('clients', { id: 'CL2', name: 'Hidden Co', deleted: 'true' })
  tabs.seed('jobs', { id: 'J1', client_id: 'CL1', description: 'Lamp shade', status: 'draft' })
  tabs.seed('pieces', { id: 'P1', job_id: 'J1', name: 'Bracket', status: 'pending' })
  tabs.seed('crm_notes', {
    id: 'CN1',
    entity_type: 'client',
    entity_id: 'CL1',
    body: 'quarterly follow-up call',
    severity: 'info',
  })
  tabs.seed('crm_notes', {
    id: 'JN1',
    entity_type: 'job',
    entity_id: 'J1',
    body: 'reprint risk noted',
    severity: 'warning',
  })
  tabs.seed('transactions', {
    id: 'T1',
    date: '2026-01-15',
    type: 'income',
    amount: '25',
    concept: 'Deposit lamp',
    client_id: 'CL1',
  })
  tabs.seed('inventory', { id: 'INV1', type: 'filament', name: 'PLA Vermilion' })
  tabs.seed('tags', { id: 'TG1', name: 'wholesale' })
  tabs.seed('tag_links', { id: 'TL1', tag_id: 'TG1', entity_type: 'client', entity_id: 'CL1' })
  return context
}

describe('globalSearch', () => {
  it('returns nothing for queries shorter than 2 characters', () => {
    const { em } = seeded()
    expect(globalSearch(em, '', t)).toEqual([])
    expect(globalSearch(em, ' A ', t)).toEqual([])
  })

  it('finds clients with navigate targets and secondary lines', () => {
    const { em } = seeded()
    const hits = globalSearch(em, 'Acme', t)
    expect(hits[0]).toMatchObject({
      kind: 'client',
      id: 'CL1',
      navigateTo: '/clients/CL1',
      primaryLine: 'Acme Corp',
      secondaryLine: 'CL1 · a@b.c',
    })
  })

  it('never surfaces archived or deleted rows', () => {
    const { em } = seeded()
    expect(globalSearch(em, 'Hidden', t)).toEqual([])
  })

  it('routes each kind to its hash path', () => {
    const { em } = seeded()
    expect(globalSearch(em, 'Lamp shade', t)[0]).toMatchObject({
      kind: 'job',
      navigateTo: '/jobs/J1',
      secondaryLine: 'Acme Corp',
    })
    expect(globalSearch(em, 'Bracket', t)[0]).toMatchObject({
      kind: 'piece',
      navigateTo: '/jobs/J1',
      secondaryLine: 'J1 — Lamp shade',
    })
    expect(globalSearch(em, 'quarterly follow', t)[0]).toMatchObject({
      kind: 'client_note',
      navigateTo: '/clients/CL1',
      secondaryLine: 'Acme Corp',
    })
    expect(globalSearch(em, 'reprint risk', t)[0]).toMatchObject({
      kind: 'job_note',
      navigateTo: '/jobs/J1',
      secondaryLine: 'J1 — Lamp shade',
    })
    expect(globalSearch(em, 'Deposit', t)[0]).toMatchObject({
      kind: 'transaction',
      navigateTo: '/transactions',
      secondaryLine: '2026-01-15',
    })
    expect(globalSearch(em, 'Vermilion', t)[0]).toMatchObject({
      kind: 'inventory',
      navigateTo: '/inventory/INV1',
      secondaryLine: 'inventory.type.filament',
    })
    // The tagged client matches the same query, so pick the tag hit explicitly.
    expect(globalSearch(em, 'wholesale', t).find((hit) => hit.kind === 'tag')).toMatchObject({
      kind: 'tag',
      navigateTo: '/clients',
      primaryLine: 'Wholesale',
    })
  })

  it('routes tags linked only to jobs to /jobs and unlinked tags to /clients', () => {
    const { em, tabs } = makeEm()
    tabs.seed('tags', { id: 'TG1', name: 'rush' })
    tabs.seed('tag_links', { id: 'TL1', tag_id: 'TG1', entity_type: 'job', entity_id: 'J1' })
    tabs.seed('tags', { id: 'TG2', name: 'rusty' })
    expect(globalSearch(em, 'rush', t).find((hit) => hit.id === 'TG1')?.navigateTo).toBe('/jobs')
    expect(globalSearch(em, 'rusty', t).find((hit) => hit.id === 'TG2')?.navigateTo).toBe(
      '/clients',
    )
  })

  it('puts exact id matches first', () => {
    const { em, tabs } = makeEm()
    tabs.seed('jobs', { id: 'JZZ', client_id: 'CL1', description: 'JZZ1 related', status: 'draft' })
    tabs.seed('jobs', { id: 'J1', client_id: 'CL1', description: 'mentions JZZ', status: 'draft' })
    const hits = globalSearch(em, 'JZZ', t)
    expect(hits[0]).toMatchObject({ kind: 'job', id: 'JZZ' })
  })

  it('caps results at 10 with a deterministic kind+id tiebreak', () => {
    const { em, tabs } = makeEm()
    for (let index = 1; index <= 12; index += 1) {
      tabs.seed('clients', { id: `CL${index}`, name: `SharedName ${index}` })
    }
    const hits = globalSearch(em, 'SharedName', t)
    expect(hits).toHaveLength(GLOBAL_SEARCH_MAX_RESULTS)
    const sorted = [...hits].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1
      return a.id < b.id ? -1 : 1
    })
    expect(hits).toEqual(sorted)
  })

  it('searches tag names attached to clients and jobs', () => {
    const { em, tabs } = seeded()
    tabs.seed('tag_links', { id: 'TL2', tag_id: 'TG1', entity_type: 'job', entity_id: 'J1' })
    const kinds = globalSearch(em, 'Wholesale', t).map((hit) => hit.kind)
    expect(kinds).toContain('client')
    expect(kinds).toContain('job')
    expect(kinds).toContain('tag')
  })

  it('condenses long note bodies into a primary line', () => {
    const { em, tabs } = makeEm()
    tabs.seed('crm_notes', {
      id: 'CN1',
      entity_type: 'client',
      entity_id: 'CL9',
      body: `verbose   ${'x'.repeat(100)}`,
      severity: 'info',
    })
    tabs.seed('crm_notes', { id: 'CN2', entity_type: 'client', entity_id: 'CL9', body: '   ' })
    const hits = globalSearch(em, 'verbose', t)
    expect(hits[0]?.primaryLine.length).toBeLessThanOrEqual(80)
    expect(hits[0]?.primaryLine.endsWith('…')).toBe(true)
    // Unknown client parents fall back to the raw id.
    expect(hits[0]?.secondaryLine).toBe('CL9')
  })

  it('ignores tag links pointing at missing tags when building blobs', () => {
    const { em, tabs } = makeEm()
    tabs.seed('clients', { id: 'CL1', name: 'Solo Client' })
    tabs.seed('tag_links', { id: 'TL1', tag_id: 'TG9', entity_type: 'client', entity_id: 'CL1' })
    const hits = globalSearch(em, 'Solo Client', t)
    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatchObject({ kind: 'client', id: 'CL1' })
  })

  it('keeps duplicate kind+id rows adjacent (equal tiebreak)', () => {
    const { em, tabs } = makeEm()
    tabs.seed('clients', { id: 'CL1', name: 'Twin Row' })
    tabs.seed('clients', { id: 'CL1', name: 'Twin Row' })
    const hits = globalSearch(em, 'Twin Row', t)
    expect(hits.map((hit) => hit.id)).toEqual(['CL1', 'CL1'])
  })

  it('labels pieces of unknown jobs with the raw job id', () => {
    const { em, tabs } = makeEm()
    tabs.seed('pieces', { id: 'P1', job_id: 'J9', name: 'Orphan piece', status: 'pending' })
    expect(globalSearch(em, 'Orphan piece', t)[0]).toMatchObject({
      kind: 'piece',
      secondaryLine: 'J9',
    })
  })
})
