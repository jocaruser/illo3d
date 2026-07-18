import { describe, expect, it } from 'vitest'
import { LifecycleService } from '@/Service/LifecycleService'
import { auditTrail, makeEm, type TestContext } from './helpers'

/** Client CL1 → job J1 → pieces P1 (items PI1, PI2), notes and tags on both levels. */
function seededTree(): TestContext & { service: LifecycleService } {
  const context = makeEm()
  const { tabs } = context
  tabs.seed('clients', { id: 'CL1', name: 'Acme' })
  tabs.seed('jobs', { id: 'J1', client_id: 'CL1', status: 'draft' })
  tabs.seed('pieces', { id: 'P1', job_id: 'J1' })
  tabs.seed('piece_items', { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '1' })
  tabs.seed('piece_items', { id: 'PI2', piece_id: 'P1', inventory_id: 'INV2', quantity: '2' })
  tabs.seed('crm_notes', { id: 'CN1', entity_type: 'client', entity_id: 'CL1', body: 'c' })
  tabs.seed('crm_notes', { id: 'JN1', entity_type: 'job', entity_id: 'J1', body: 'j' })
  tabs.seed('tag_links', { id: 'TL1', tag_id: 'TG1', entity_type: 'client', entity_id: 'CL1' })
  tabs.seed('tag_links', { id: 'TL2', tag_id: 'TG1', entity_type: 'job', entity_id: 'J1' })
  return { ...context, service: new LifecycleService(context.em) }
}

describe('client cascade', () => {
  it('archiveClient flags the client, its notes, tags, jobs and their subtree', () => {
    const { em, tabs, service } = seededTree()
    service.archiveClient('CL1')
    expect(em.clients.find('CL1')?.isArchived()).toBe(true)
    expect(em.jobs.find('J1')?.isArchived()).toBe(true)
    expect(em.pieces.find('P1')?.isArchived()).toBe(true)
    expect(em.pieceItems.find('PI1')?.isArchived()).toBe(true)
    expect(em.pieceItems.find('PI2')?.isArchived()).toBe(true)
    expect(em.crmNotes.find('CN1')?.isArchived()).toBe(true)
    expect(em.crmNotes.find('JN1')?.isArchived()).toBe(true)
    expect(em.tagLinks.find('TL1')?.isArchived()).toBe(true)
    expect(em.tagLinks.find('TL2')?.isArchived()).toBe(true)
    expect(auditTrail(tabs)).toEqual([
      'client/archive/CL1',
      'crm_note/archive/CN1',
      'tag_link/archive/TL1',
      'job/archive/J1',
      'piece/archive/P1',
      'piece_item/archive/PI1',
      'piece_item/archive/PI2',
      'crm_note/archive/JN1',
      'tag_link/archive/TL2',
    ])
  })

  it('softDeleteClient cascades the deleted flag', () => {
    const { em, service } = seededTree()
    service.softDeleteClient('CL1')
    expect(em.clients.find('CL1')?.isDeleted()).toBe(true)
    expect(em.pieceItems.find('PI2')?.isDeleted()).toBe(true)
  })

  it('cascaded audit entries carry the immediate parent', () => {
    const { tabs, service } = seededTree()
    service.archiveClient('CL1')
    const rows = tabs.matrix('audit_log').slice(1)
    const byEntity = new Map(rows.map((row) => [row[4], row]))
    expect(byEntity.get('CL1')?.[9]).toBe('')
    expect(byEntity.get('J1')?.slice(9)).toEqual(['client', 'CL1'])
    expect(byEntity.get('P1')?.slice(9)).toEqual(['job', 'J1'])
    expect(byEntity.get('PI1')?.slice(9)).toEqual(['piece', 'P1'])
    expect(byEntity.get('JN1')?.slice(9)).toEqual(['job', 'J1'])
    expect(byEntity.get('TL1')?.slice(9)).toEqual(['client', 'CL1'])
  })

  it('is a no-op for missing or already-flagged clients', () => {
    const { tabs, service } = seededTree()
    service.archiveClient('CL9')
    expect(auditTrail(tabs)).toEqual([])
    service.archiveClient('CL1')
    const count = auditTrail(tabs).length
    service.archiveClient('CL1')
    expect(auditTrail(tabs)).toHaveLength(count)
  })
})

describe('job cascade', () => {
  it('archiveJob flags the job, pieces, items, notes and tags', () => {
    const { em, tabs, service } = seededTree()
    service.archiveJob('J1')
    expect(em.jobs.find('J1')?.isArchived()).toBe(true)
    expect(em.pieces.find('P1')?.isArchived()).toBe(true)
    expect(em.pieceItems.find('PI1')?.isArchived()).toBe(true)
    expect(em.crmNotes.find('JN1')?.isArchived()).toBe(true)
    expect(em.tagLinks.find('TL2')?.isArchived()).toBe(true)
    expect(em.clients.find('CL1')?.isArchived()).toBe(false)
    expect(em.crmNotes.find('CN1')?.isArchived()).toBe(false)
    expect(auditTrail(tabs)[0]).toBe('job/archive/J1')
  })

  it('short-circuits already-flagged pieces, items and notes', () => {
    const { em, tabs, service } = seededTree()
    const piece = em.pieces.find('P1')
    if (piece) {
      piece.archived = 'true'
      em.pieces.save(piece)
    }
    const note = em.crmNotes.find('JN1')
    if (note) {
      note.archived = 'true'
      em.crmNotes.save(note)
    }
    const baseline = auditTrail(tabs).length
    service.archiveJob('J1')
    const trail = auditTrail(tabs).slice(baseline)
    expect(trail).toEqual(['job/archive/J1', 'tag_link/archive/TL2'])
  })

  it('softDeleteJob skips already-deleted items inside a flagged piece', () => {
    const { em, tabs, service } = seededTree()
    const item = em.pieceItems.find('PI1')
    if (item) {
      item.deleted = 'true'
      em.pieceItems.save(item)
    }
    const baseline = auditTrail(tabs).length
    service.softDeleteJob('J1')
    const trail = auditTrail(tabs).slice(baseline)
    expect(trail).toContain('piece_item/delete/PI2')
    expect(trail).not.toContain('piece_item/delete/PI1')
  })

  it('is a no-op for missing jobs', () => {
    const { tabs, service } = seededTree()
    service.softDeleteJob('J9')
    expect(auditTrail(tabs)).toEqual([])
  })
})

describe('inventory cascade', () => {
  function seededInventory() {
    const context = makeEm()
    context.tabs.seed('inventory', { id: 'INV1', type: 'filament', name: 'PLA' })
    context.tabs.seed('lots', { id: 'L1', inventory_id: 'INV1', transaction_id: 'T1' })
    context.tabs.seed('lots', {
      id: 'L2',
      inventory_id: 'INV1',
      transaction_id: 'T2',
      deleted: 'true',
    })
    return { ...context, service: new LifecycleService(context.em) }
  }

  it('archiveInventory flags the item and its active lots only', () => {
    const { em, tabs, service } = seededInventory()
    service.archiveInventory('INV1')
    expect(em.inventory.find('INV1')?.isArchived()).toBe(true)
    expect(em.lots.find('L1')?.isArchived()).toBe(true)
    expect(em.lots.find('L2')?.isArchived()).toBe(false)
    expect(auditTrail(tabs)).toEqual(['inventory/archive/INV1', 'lot/archive/L1'])
  })

  it('softDeleteInventory flags the deleted column', () => {
    const { em, service } = seededInventory()
    service.softDeleteInventory('INV1')
    expect(em.inventory.find('INV1')?.isDeleted()).toBe(true)
    expect(em.lots.find('L1')?.isDeleted()).toBe(true)
  })

  it('is a no-op for missing or flagged inventory', () => {
    const { tabs, service } = seededInventory()
    service.archiveInventory('INV9')
    expect(auditTrail(tabs)).toEqual([])
    service.archiveInventory('INV1')
    const count = auditTrail(tabs).length
    service.archiveInventory('INV1')
    expect(auditTrail(tabs)).toHaveLength(count)
  })
})

describe('restores', () => {
  it('restore clears both flags without cascading', () => {
    const { em, service } = seededTree()
    service.softDeleteClient('CL1')
    service.restoreClient('CL1')
    expect(em.clients.find('CL1')?.isActive()).toBe(true)
    // Children stay flagged — restores never cascade.
    expect(em.jobs.find('J1')?.isDeleted()).toBe(true)

    service.restoreJob('J1')
    expect(em.jobs.find('J1')?.isActive()).toBe(true)
    expect(em.pieces.find('P1')?.isDeleted()).toBe(true)
  })

  it('restorePiece clears both flags without cascading to its items', () => {
    const { em, service } = seededTree()
    service.archiveJob('J1')
    service.restorePiece('P1')
    expect(em.pieces.find('P1')?.isActive()).toBe(true)
    expect(em.pieceItems.find('PI1')?.isArchived()).toBe(true)
  })

  it('restoreInventory clears both flags', () => {
    const context = makeEm()
    context.tabs.seed('inventory', { id: 'INV1', archived: 'true', deleted: 'true' })
    const service = new LifecycleService(context.em)
    service.restoreInventory('INV1')
    expect(context.em.inventory.find('INV1')?.isActive()).toBe(true)
  })

  it('restores are no-ops for missing entities', () => {
    const { tabs, service } = seededTree()
    service.restoreClient('CL9')
    service.restoreJob('J9')
    service.restorePiece('P9')
    service.restoreInventory('INV9')
    expect(auditTrail(tabs)).toEqual([])
  })
})
