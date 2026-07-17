import { describe, expect, it } from 'vitest'
import { CrmNote, NOTE_SEVERITIES, isNoteSeverity } from '@/Entity/CrmNote'

const record = {
  id: 'CN1',
  entity_type: 'client',
  entity_id: 'CL1',
  body: 'Call @CL2 about @J1',
  referenced_entity_ids: 'CL2 J1',
  severity: 'warning',
  created_at: '2026-01-01T00:00:00.000Z',
  archived: '',
  deleted: '',
}

describe('CrmNote', () => {
  it('round-trips fromRecord/toRecord', () => {
    const note = CrmNote.fromRecord(record)
    expect(note.entityType).toBe('client')
    expect(note.severity).toBe('warning')
    expect(note.toRecord()).toEqual(record)
  })

  it('blanks unknown entity types and falls back to info severity', () => {
    const note = CrmNote.fromRecord({ entity_type: 'piece', severity: 'loud' })
    expect(note.entityType).toBe('')
    expect(note.severity).toBe('info')
    expect(CrmNote.fromRecord({ entity_type: 'job' }).entityType).toBe('job')
    expect(CrmNote.fromRecord({}).severity).toBe('info')
  })

  it('isNoteSeverity accepts exactly the canonical severities', () => {
    for (const severity of NOTE_SEVERITIES) expect(isNoteSeverity(severity)).toBe(true)
    expect(isNoteSeverity('loud')).toBe(false)
  })

  it('isProminent excludes info and secondary', () => {
    const note = new CrmNote()
    expect(note.isProminent()).toBe(false)
    note.severity = 'secondary'
    expect(note.isProminent()).toBe(false)
    note.severity = 'danger'
    expect(note.isProminent()).toBe(true)
    note.severity = 'success'
    expect(note.isProminent()).toBe(true)
  })
})
