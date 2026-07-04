import { describe, it, expect } from 'vitest'
import { generateAuditId } from './generateAuditId'
import { createAuditEntry, auditEntryToRow } from './createAuditEntry'
import type { AuditEvent } from './auditEvent'

describe('generateAuditId', () => {
  it('returns AL1 when no ids exist', () => {
    expect(generateAuditId([])).toBe('AL1')
  })

  it('increments from existing AL ids', () => {
    expect(generateAuditId(['AL1', 'AL2', 'AL5'])).toBe('AL6')
  })

  it('ignores non-AL ids', () => {
    expect(generateAuditId(['CL1', 'TG2', 'AL3'])).toBe('AL4')
  })
})

describe('createAuditEntry', () => {
  it('serializes before and after snapshots to JSON', () => {
    const event: AuditEvent = {
      entityName: 'client',
      entityId: 'CL1',
      action: 'update',
      before: { name: 'Old' },
      after: { name: 'New' },
    }
    const entry = createAuditEntry('AL1', '2024-01-15T10:00:00.000Z', 'user@example.com', event)
    expect(entry).toEqual({
      id: 'AL1',
      timestamp: '2024-01-15T10:00:00.000Z',
      actor: 'user@example.com',
      entity_name: 'client',
      entity_id: 'CL1',
      action: 'update',
      before_json: '{"name":"Old"}',
      after_json: '{"name":"New"}',
      parent_entity_name: null,
      parent_entity_id: null,
    })
  })

  it('uses null for missing before and after', () => {
    const event: AuditEvent = {
      entityName: 'client',
      entityId: 'CL1',
      action: 'create',
      before: null,
      after: { id: 'CL1' },
    }
    const entry = createAuditEntry('AL2', '2024-01-15T10:00:00.000Z', 'local', event)
    expect(entry.before_json).toBeNull()
    expect(entry.after_json).toBe('{"id":"CL1"}')
  })
})

describe('auditEntryToRow', () => {
  it('converts null JSON fields to empty strings', () => {
    const entry = createAuditEntry(
      'AL1',
      '2024-01-15T10:00:00.000Z',
      'local',
      {
        entityName: 'client',
        entityId: 'CL1',
        action: 'create',
        before: null,
        after: { id: 'CL1' },
        parentEntityName: 'job',
        parentEntityId: 'J1',
      }
    )
    const row = auditEntryToRow(entry)
    expect(row).toEqual({
      id: 'AL1',
      timestamp: '2024-01-15T10:00:00.000Z',
      actor: 'local',
      entity_name: 'client',
      entity_id: 'CL1',
      action: 'create',
      before_json: '',
      after_json: '{"id":"CL1"}',
      parent_entity_name: 'job',
      parent_entity_id: 'J1',
    })
  })
})
