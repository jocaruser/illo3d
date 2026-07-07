import { describe, it, expect } from 'vitest'
import { matrixToAuditEntries } from './workbookEntities'
import { matrixWithRows } from '@/test/workbookHarness'

describe('matrixToAuditEntries', () => {
  it('parses valid rows and sorts by timestamp desc, then id asc', () => {
    const matrix = matrixWithRows('audit_log', [
      {
        id: 'AL002',
        timestamp: '2025-01-20T14:30:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL2',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
      {
        id: 'AL001',
        timestamp: '2025-01-15T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL1',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
    ])

    const entries = matrixToAuditEntries(matrix)
    expect(entries).toHaveLength(2)
    expect(entries[0].id).toBe('AL002')
    expect(entries[1].id).toBe('AL001')
  })

  it('breaks ties by id ascending when timestamps are equal', () => {
    const matrix = matrixWithRows('audit_log', [
      {
        id: 'AL003',
        timestamp: '2025-01-15T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL3',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
      {
        id: 'AL001',
        timestamp: '2025-01-15T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL1',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
      {
        id: 'AL002',
        timestamp: '2025-01-15T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL2',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
    ])

    const entries = matrixToAuditEntries(matrix)
    expect(entries.map((e) => e.id)).toEqual(['AL001', 'AL002', 'AL003'])
  })

  it('skips malformed rows missing required fields', () => {
    const matrix = matrixWithRows('audit_log', [
      {
        id: 'AL001',
        timestamp: '2025-01-15T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL1',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
      {
        id: '',
        timestamp: '2025-01-16T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL2',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
      {
        id: 'AL003',
        timestamp: '',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL3',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
      {
        id: 'AL004',
        timestamp: '2025-01-17T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL4',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: '',
        parent_entity_name: '',
        parent_entity_id: '',
      },
    ])

    const entries = matrixToAuditEntries(matrix)
    expect(entries).toHaveLength(2)
    expect(entries.map((e) => e.id)).toEqual(['AL004', 'AL001'])
  })

  it('skips rows with invalid entity_name or action', () => {
    const matrix = matrixWithRows('audit_log', [
      {
        id: 'AL001',
        timestamp: '2025-01-15T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL1',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
      {
        id: 'AL002',
        timestamp: '2025-01-16T09:00:00.000Z',
        actor: 'local',
        entity_name: 'invalid_entity',
        entity_id: 'CL2',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
      {
        id: 'AL003',
        timestamp: '2025-01-17T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL3',
        action: 'invalid_action',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
    ])

    const entries = matrixToAuditEntries(matrix)
    expect(entries).toHaveLength(1)
    expect(entries[0].id).toBe('AL001')
  })

  it('preserves parent_entity_name and parent_entity_id when present', () => {
    const matrix = matrixWithRows('audit_log', [
      {
        id: 'AL001',
        timestamp: '2025-01-15T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL1',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: 'job',
        parent_entity_id: 'J1',
      },
      {
        id: 'AL002',
        timestamp: '2025-01-16T09:00:00.000Z',
        actor: 'local',
        entity_name: 'client',
        entity_id: 'CL2',
        action: 'create',
        before_json: '',
        after_json: '{}',
        fieldsChanged: 'id;name',
        parent_entity_name: '',
        parent_entity_id: '',
      },
    ])

    const entries = matrixToAuditEntries(matrix)
    expect(entries).toHaveLength(2)
    const withParent = entries.find((e) => e.id === 'AL001')
    expect(withParent?.parent_entity_name).toBe('job')
    expect(withParent?.parent_entity_id).toBe('J1')
    const withoutParent = entries.find((e) => e.id === 'AL002')
    expect(withoutParent?.parent_entity_name).toBeUndefined()
    expect(withoutParent?.parent_entity_id).toBeUndefined()
  })

  it('returns empty array for empty or undefined matrix', () => {
    expect(matrixToAuditEntries(undefined)).toEqual([])
    expect(matrixToAuditEntries([['id', 'timestamp', 'actor', 'entity_name', 'entity_id', 'action', 'before_json', 'after_json', 'fieldsChanged', 'parent_entity_name', 'parent_entity_id']])).toEqual([])
  })
})
