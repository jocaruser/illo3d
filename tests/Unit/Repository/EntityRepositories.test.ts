import { describe, expect, it } from 'vitest'
import { makeEm, type TestContext } from '../Service/helpers'

function seeded(): TestContext {
  const context = makeEm()
  const { tabs } = context
  tabs.seed('clients', { id: 'CL1', name: 'Acme' })
  tabs.seed('jobs', { id: 'J1', client_id: 'CL1', status: 'draft' })
  tabs.seed('jobs', { id: 'J2', client_id: 'CL1', status: 'paid', deleted: 'true' })
  tabs.seed('jobs', { id: 'J3', client_id: 'CL2', status: 'draft' })
  tabs.seed('pieces', { id: 'P1', job_id: 'J1', status: 'pending' })
  tabs.seed('pieces', { id: 'P2', job_id: 'J1', status: 'done', archived: 'true' })
  tabs.seed('pieces', { id: 'P3', job_id: 'J1', status: 'done', deleted: 'true' })
  tabs.seed('piece_items', { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '2' })
  tabs.seed('piece_items', {
    id: 'PI2',
    piece_id: 'P1',
    inventory_id: 'INV2',
    quantity: '1',
    deleted: 'true',
  })
  tabs.seed('piece_items', { id: 'PI3', piece_id: 'P2', inventory_id: 'INV1', quantity: '5' })
  tabs.seed('lots', { id: 'L1', inventory_id: 'INV1', transaction_id: 'T1', quantity: '10' })
  tabs.seed('lots', {
    id: 'L2',
    inventory_id: 'INV1',
    transaction_id: 'T2',
    quantity: '5',
    archived: 'true',
  })
  tabs.seed('transactions', { id: 'T1', type: 'income', client_id: 'CL1', amount: '10' })
  tabs.seed('transactions', { id: 'T2', type: 'expense', client_id: 'CL1', amount: '-5' })
  tabs.seed('transactions', {
    id: 'T3',
    type: 'income',
    client_id: 'CL1',
    amount: '7',
    deleted: 'true',
  })
  tabs.seed('tags', { id: 'TG1', name: 'Vip Client' })
  tabs.seed('tags', { id: 'TG2', name: 'Old', deleted: 'true' })
  tabs.seed('tag_links', { id: 'TL1', tag_id: 'TG1', entity_type: 'client', entity_id: 'CL1' })
  tabs.seed('crm_notes', { id: 'CN1', entity_type: 'client', entity_id: 'CL1', body: 'a' })
  tabs.seed('crm_notes', {
    id: 'CN2',
    entity_type: 'client',
    entity_id: 'CL1',
    body: 'b',
    deleted: 'true',
  })
  tabs.seed('crm_notes', { id: 'JN4', entity_type: 'job', entity_id: 'J1', body: 'c' })
  return context
}

describe('JobRepository', () => {
  it('finds jobs by client, active or not', () => {
    const { em } = seeded()
    expect(em.jobs.findByClient('CL1').map((job) => job.id)).toEqual(['J1', 'J2'])
    expect(em.jobs.findActiveByClient('CL1').map((job) => job.id)).toEqual(['J1'])
  })
})

describe('PieceRepository', () => {
  it('findByJob returns every piece; counting excludes only deleted', () => {
    const { em } = seeded()
    expect(em.pieces.findByJob('J1').map((piece) => piece.id)).toEqual(['P1', 'P2', 'P3'])
    expect(em.pieces.findCountingByJob('J1').map((piece) => piece.id)).toEqual(['P1', 'P2'])
  })
})

describe('PieceItemRepository', () => {
  it('filters lines by piece and by inventory', () => {
    const { em } = seeded()
    expect(em.pieceItems.findByPiece('P1').map((item) => item.id)).toEqual(['PI1', 'PI2'])
    expect(em.pieceItems.findActiveByPiece('P1').map((item) => item.id)).toEqual(['PI1'])
    expect(em.pieceItems.findActiveByInventory('INV1').map((item) => item.id)).toEqual([
      'PI1',
      'PI3',
    ])
  })

  it('hasActiveLine ignores deleted lines', () => {
    const { em } = seeded()
    expect(em.pieceItems.hasActiveLine('P1', 'INV1')).toBe(true)
    expect(em.pieceItems.hasActiveLine('P1', 'INV2')).toBe(false)
  })
})

describe('LotRepository', () => {
  it('filters active lots by inventory and transaction', () => {
    const { em } = seeded()
    expect(em.lots.findActiveByInventory('INV1').map((lot) => lot.id)).toEqual(['L1'])
    expect(em.lots.findActiveByTransaction('T1').map((lot) => lot.id)).toEqual(['L1'])
    expect(em.lots.findActiveByTransaction('T2')).toEqual([])
  })
})

describe('TransactionRepository', () => {
  it('findActiveIncomeByClient excludes expenses and deleted rows', () => {
    const { em } = seeded()
    expect(em.transactions.findActiveIncomeByClient('CL1').map((t) => t.id)).toEqual(['T1'])
  })
})

describe('TagRepository', () => {
  it('findActiveByName matches case-insensitively on trimmed names', () => {
    const { em } = seeded()
    expect(em.tags.findActiveByName('  vip client ')?.id).toBe('TG1')
    expect(em.tags.findActiveByName('old')).toBeNull()
    expect(em.tags.findActiveByName('missing')).toBeNull()
  })
})

describe('TagLinkRepository', () => {
  it('finds active links per entity and detects existing links', () => {
    const { em } = seeded()
    expect(em.tagLinks.findActiveByEntity('client', 'CL1').map((link) => link.id)).toEqual(['TL1'])
    expect(em.tagLinks.findActiveByEntity('job', 'J1')).toEqual([])
    expect(em.tagLinks.hasActiveLink('TG1', 'client', 'CL1')).toBe(true)
    expect(em.tagLinks.hasActiveLink('TG2', 'client', 'CL1')).toBe(false)
  })
})

describe('CrmNoteRepository', () => {
  it('scopes note ids per entity type', () => {
    const { em } = seeded()
    expect(em.crmNotes.nextIdFor('client')).toBe('CN3')
    expect(em.crmNotes.nextIdFor('job')).toBe('JN5')
  })

  it('filters notes by entity, with and without lifecycle', () => {
    const { em } = seeded()
    expect(em.crmNotes.findByEntity('client', 'CL1').map((note) => note.id)).toEqual([
      'CN1',
      'CN2',
    ])
    expect(em.crmNotes.findActiveByEntity('client', 'CL1').map((note) => note.id)).toEqual(['CN1'])
    expect(em.crmNotes.findActiveByEntity('job', 'J1').map((note) => note.id)).toEqual(['JN4'])
  })
})

describe('AuditLogRepository', () => {
  it('sorts entries newest first with id ascending tiebreak', () => {
    const { em, tabs } = makeEm()
    const base = {
      actor: 'a',
      entity_name: 'tag',
      entity_id: 'TG1',
      action: 'update',
    }
    tabs.seed('audit_log', { ...base, id: 'AL1', timestamp: '2026-01-01T00:00:00.000Z' })
    tabs.seed('audit_log', { ...base, id: 'AL3', timestamp: '2026-01-02T00:00:00.000Z' })
    tabs.seed('audit_log', { ...base, id: 'AL2', timestamp: '2026-01-02T00:00:00.000Z' })
    // Duplicate id + timestamp exercises the equal-keys tiebreak branch.
    tabs.seed('audit_log', { ...base, id: 'AL2', timestamp: '2026-01-02T00:00:00.000Z' })
    // Seeded after its same-timestamp siblings so the id tiebreak compares both ways.
    tabs.seed('audit_log', { ...base, id: 'AL4', timestamp: '2026-01-02T00:00:00.000Z' })
    // Oldest entry seeded last so the comparator also sees an older left-hand side.
    tabs.seed('audit_log', { ...base, id: 'AL0', timestamp: '2025-12-31T00:00:00.000Z' })
    expect(em.auditLog.findAll().map((entry) => entry.id)).toEqual([
      'AL2',
      'AL2',
      'AL3',
      'AL4',
      'AL1',
      'AL0',
    ])
  })
})
