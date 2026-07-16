import { describe, expect, it } from 'vitest'
import { NoteService } from '@/Service/NoteService'
import { auditTrail, makeEm } from './helpers'

function makeService() {
  const context = makeEm()
  return { ...context, service: new NoteService(context.em) }
}

describe('createNote', () => {
  it('creates a client note with mentions and scoped id', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('crm_notes', { id: 'CN3', entity_type: 'client', entity_id: 'CL2', body: 'x' })
    const result = service.createNote('client', 'CL1', 'Check @J1 and @CL2, then @J1', 'warning')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.note.id).toBe('CN4')
    expect(result.note.entityType).toBe('client')
    expect(result.note.referencedEntityIds).toBe('J1 CL2')
    expect(result.note.severity).toBe('warning')
    expect(result.note.createdAt).toBe('2026-07-16T12:00:00.000Z')
    expect(em.crmNotes.find('CN4')?.body).toBe('Check @J1 and @CL2, then @J1')
    expect(auditTrail(tabs)).toEqual(['crm_note/create/CN4'])
  })

  it('scopes job notes to JN ids', () => {
    const { service } = makeService()
    const result = service.createNote('job', 'J1', 'plain body', 'info')
    expect(result.ok && result.note.id).toBe('JN1')
    expect(result.ok && result.note.referencedEntityIds).toBe('')
  })

  it('rejects blank bodies and invalid severities', () => {
    const { service } = makeService()
    expect(service.createNote('client', 'CL1', '  ', 'info')).toEqual({
      ok: false,
      error: 'purchase.validation.required',
    })
    expect(service.createNote('client', 'CL1', 'body', 'loud')).toEqual({
      ok: false,
      error: 'errors.actionFailed',
    })
  })
})

describe('updateNote', () => {
  it('recomputes mentions and preserves createdAt', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('crm_notes', {
      id: 'CN1',
      entity_type: 'client',
      entity_id: 'CL1',
      body: 'old @J1',
      referenced_entity_ids: 'J1',
      severity: 'info',
      created_at: '2025-01-01T00:00:00.000Z',
    })
    const result = service.updateNote('CN1', 'now @P7 instead', 'danger')
    expect(result.ok).toBe(true)
    const note = em.crmNotes.find('CN1')
    expect(note?.body).toBe('now @P7 instead')
    expect(note?.referencedEntityIds).toBe('P7')
    expect(note?.severity).toBe('danger')
    expect(note?.createdAt).toBe('2025-01-01T00:00:00.000Z')
  })

  it('rejects unknown notes, blank bodies and invalid severities', () => {
    const { service, tabs } = makeService()
    tabs.seed('crm_notes', { id: 'CN1', entity_type: 'client', entity_id: 'CL1', body: 'x' })
    expect(service.updateNote('CN9', 'body', 'info')).toEqual({
      ok: false,
      error: 'errors.actionFailed',
    })
    expect(service.updateNote('CN1', ' ', 'info')).toEqual({
      ok: false,
      error: 'purchase.validation.required',
    })
    expect(service.updateNote('CN1', 'body', 'shout')).toEqual({
      ok: false,
      error: 'errors.actionFailed',
    })
  })
})

describe('deleteNote', () => {
  it('soft deletes and audits a delete action', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('crm_notes', { id: 'CN1', entity_type: 'client', entity_id: 'CL1', body: 'x' })
    const result = service.deleteNote('CN1')
    expect(result.ok).toBe(true)
    expect(em.crmNotes.find('CN1')?.isDeleted()).toBe(true)
    expect(auditTrail(tabs)).toEqual(['crm_note/delete/CN1'])
  })

  it('rejects unknown notes', () => {
    const { service } = makeService()
    expect(service.deleteNote('CN9')).toEqual({ ok: false, error: 'errors.actionFailed' })
  })
})
