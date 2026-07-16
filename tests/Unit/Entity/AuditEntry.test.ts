import { describe, expect, it } from 'vitest'
import { AUDIT_ACTIONS, AUDIT_ENTITY_NAMES, AuditEntry } from '@/Entity/AuditEntry'

const record = {
  id: 'AL1',
  timestamp: '2026-01-01T00:00:00.000Z',
  actor: 'user@example.com',
  entity_name: 'client',
  entity_id: 'CL1',
  action: 'update',
  before_json: '{"id":"CL1"}',
  after_json: '{"id":"CL1","name":"Acme"}',
  fieldsChanged: 'name',
  parent_entity_name: 'job',
  parent_entity_id: 'J1',
}

describe('AuditEntry', () => {
  it('round-trips fromRecord/toRecord', () => {
    const entry = AuditEntry.fromRecord(record)
    expect(entry.actor).toBe('user@example.com')
    expect(entry.action).toBe('update')
    expect(entry.parentEntityName).toBe('job')
    expect(entry.toRecord()).toEqual(record)
  })

  it('defaults every missing cell to empty string', () => {
    const entry = AuditEntry.fromRecord({})
    expect(entry.toRecord()).toEqual({
      id: '',
      timestamp: '',
      actor: '',
      entity_name: '',
      entity_id: '',
      action: '',
      before_json: '',
      after_json: '',
      fieldsChanged: '',
      parent_entity_name: '',
      parent_entity_id: '',
    })
  })

  it('exposes the canonical entity names and actions', () => {
    expect(AUDIT_ENTITY_NAMES).toContain('piece_item')
    expect(AUDIT_ACTIONS).toEqual(['create', 'update', 'archive', 'delete', 'restore', 'migration'])
  })
})
