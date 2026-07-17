import { describe, expect, it } from 'vitest'
import { AuditEntry } from '@/Entity/AuditEntry'
import { AuditLogger, computeFieldsChanged } from '@/Service/AuditLogger'
import { dataRows, FixedClock, makeTabs } from './helpers'

function makeLogger() {
  const tabs = makeTabs()
  const logger = new AuditLogger(tabs, new FixedClock('2026-07-16T12:00:00.000Z'), () => 'me@x.y')
  return { tabs, logger }
}

describe('computeFieldsChanged', () => {
  it('names every column whose value differs, treating missing keys as empty', () => {
    expect(
      computeFieldsChanged({ id: 'CL1', name: 'a', email: '' }, { id: 'CL1', name: 'b', phone: '6' }),
    ).toEqual(expect.arrayContaining(['name', 'phone']))
    expect(computeFieldsChanged({ name: 'a' }, { name: 'a' })).toEqual([])
  })

  it('handles creates and deletes with a null side', () => {
    expect(computeFieldsChanged(null, { id: 'CL1', name: 'a', notes: '' })).toEqual(
      expect.arrayContaining(['id', 'name']),
    )
    expect(computeFieldsChanged(null, { id: 'CL1', name: 'a', notes: '' })).not.toContain('notes')
    expect(computeFieldsChanged({ id: 'CL1' }, null)).toEqual(['id'])
    expect(computeFieldsChanged(null, null)).toEqual([])
  })
})

describe('AuditLogger.log', () => {
  it('appends a create entry with no before snapshot', () => {
    const { tabs, logger } = makeLogger()
    const entry = logger.log('client', 'create', null, {
      id: 'CL1',
      name: 'Acme',
      archived: '',
      deleted: '',
    })
    expect(entry).toBeInstanceOf(AuditEntry)
    expect(entry.id).toBe('AL1')
    expect(entry.timestamp).toBe('2026-07-16T12:00:00.000Z')
    expect(entry.actor).toBe('me@x.y')
    expect(entry.beforeJson).toBe('')
    // Empty lifecycle flags are stripped from snapshots.
    expect(entry.afterJson).toBe('{"id":"CL1","name":"Acme"}')
    expect(entry.entityId).toBe('CL1')
    expect(dataRows(tabs, 'audit_log')).toHaveLength(1)
  })

  it('keeps set lifecycle flags in the snapshots', () => {
    const { logger } = makeLogger()
    const entry = logger.log(
      'job',
      'archive',
      { id: 'J1', archived: '', deleted: '' },
      { id: 'J1', archived: 'true', deleted: '' },
    )
    expect(entry.beforeJson).toBe('{"id":"J1"}')
    expect(entry.afterJson).toBe('{"id":"J1","archived":"true"}')
    expect(entry.fieldsChanged).toBe('archived')
  })

  it('uses the before id for hard deletes and joins changed fields with semicolons', () => {
    const { logger } = makeLogger()
    const entry = logger.log('tag_link', 'delete', { id: 'TL1', tag_id: 'TG1' }, null)
    expect(entry.entityId).toBe('TL1')
    expect(entry.afterJson).toBe('')
    expect(entry.fieldsChanged.split(';').sort()).toEqual(['id', 'tag_id'])
  })

  it('falls back to an empty entity id when both snapshots are null', () => {
    const { logger } = makeLogger()
    expect(logger.log('client', 'update', null, null).entityId).toBe('')
  })

  it('records the cascade parent and increments ids', () => {
    const { tabs, logger } = makeLogger()
    logger.log('job', 'create', null, { id: 'J1' })
    const entry = logger.log(
      'piece',
      'archive',
      { id: 'P1' },
      { id: 'P1', archived: 'true' },
      { entityName: 'job', entityId: 'J1' },
    )
    expect(entry.id).toBe('AL2')
    expect(entry.parentEntityName).toBe('job')
    expect(entry.parentEntityId).toBe('J1')
    expect(dataRows(tabs, 'audit_log')).toHaveLength(2)
  })
})
