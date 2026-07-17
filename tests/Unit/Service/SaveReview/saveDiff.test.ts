import { AuditEntry } from '@/Entity/AuditEntry'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { appendRecord } from '@/Repository/Matrix'
import {
  computeSaveDiff,
  unsavedAuditEntries,
} from '@/Service/SaveReview/saveDiff'
import { emptyTabs } from '@/Store/workbookStore'

function entry(record: Partial<SheetRecord>): AuditEntry {
  return AuditEntry.fromRecord({
    id: 'AL1',
    timestamp: '2026-01-01T00:00:00.000Z',
    actor: 'local',
    entity_name: 'tag',
    entity_id: 'TG1',
    action: 'update',
    before_json: '',
    after_json: '',
    fieldsChanged: '',
    parent_entity_name: '',
    parent_entity_id: '',
    ...record,
  })
}

describe('unsavedAuditEntries', () => {
  it('returns only the rows appended past the saved baseline, oldest first', () => {
    const tabs = emptyTabs()
    tabs.audit_log = appendRecord('audit_log', tabs.audit_log, entry({ id: 'AL1' }).toRecord())
    tabs.audit_log = appendRecord('audit_log', tabs.audit_log, entry({ id: 'AL2' }).toRecord())
    tabs.audit_log = appendRecord('audit_log', tabs.audit_log, entry({ id: 'AL3' }).toRecord())

    const entries = unsavedAuditEntries(tabs, 1)

    expect(entries.map((e) => e.id)).toEqual(['AL2', 'AL3'])
    expect(entries[0]).toBeInstanceOf(AuditEntry)
  })

  it('is empty when everything is persisted', () => {
    const tabs = emptyTabs()
    tabs.audit_log = appendRecord('audit_log', tabs.audit_log, entry({ id: 'AL1' }).toRecord())

    expect(unsavedAuditEntries(tabs, 1)).toEqual([])
  })
})

describe('computeSaveDiff', () => {
  it('reports a created row with its non-empty fields as additions', () => {
    const diff = computeSaveDiff([
      entry({
        entity_name: 'tag',
        entity_id: 'TG1',
        action: 'create',
        after_json: JSON.stringify({ id: 'TG1', name: 'Vip', created_at: '2026-01-01' }),
      }),
    ])

    const rows = diff.rowsBySheet.tags ?? []
    expect(rows).toHaveLength(1)
    expect(rows[0].action).toBe('created')
    expect(rows[0].sheet).toBe('tags')
    const name = rows[0].fields.find((field) => field.column === 'name')
    expect(name).toEqual({ column: 'name', before: '', after: 'Vip', changed: true })
    expect(rows[0].changedCount).toBe(3)
  })

  it('coalesces several edits of one row into first-before vs last-after', () => {
    const diff = computeSaveDiff([
      entry({
        id: 'AL1',
        entity_name: 'client',
        entity_id: 'CL1',
        before_json: JSON.stringify({ id: 'CL1', name: 'Acme', email: 'a@x.com' }),
        after_json: JSON.stringify({ id: 'CL1', name: 'Acme Ltd', email: 'a@x.com' }),
      }),
      entry({
        id: 'AL2',
        entity_name: 'client',
        entity_id: 'CL1',
        before_json: JSON.stringify({ id: 'CL1', name: 'Acme Ltd', email: 'a@x.com' }),
        after_json: JSON.stringify({ id: 'CL1', name: 'Acme Ltd', email: 'b@x.com' }),
      }),
    ])

    const rows = diff.rowsBySheet.clients ?? []
    expect(rows).toHaveLength(1)
    expect(rows[0].action).toBe('modified')
    expect(rows[0].changedCount).toBe(2)
    const name = rows[0].fields.find((field) => field.column === 'name')
    expect(name).toEqual({ column: 'name', before: 'Acme', after: 'Acme Ltd', changed: true })
    const email = rows[0].fields.find((field) => field.column === 'email')
    expect(email).toEqual({ column: 'email', before: 'a@x.com', after: 'b@x.com', changed: true })
  })

  it('reports a hard-deleted row with its old fields as removals', () => {
    const diff = computeSaveDiff([
      entry({
        entity_name: 'tag_link',
        entity_id: 'TL1',
        action: 'delete',
        before_json: JSON.stringify({ id: 'TL1', tag_id: 'TG1', entity_type: 'client' }),
        after_json: '',
      }),
    ])

    const rows = diff.rowsBySheet.tag_links ?? []
    expect(rows).toHaveLength(1)
    expect(rows[0].action).toBe('deleted')
    const tagId = rows[0].fields.find((field) => field.column === 'tag_id')
    expect(tagId).toEqual({ column: 'tag_id', before: 'TG1', after: '', changed: true })
  })

  it('drops a row created and hard-deleted before ever being saved', () => {
    const diff = computeSaveDiff([
      entry({
        id: 'AL1',
        entity_name: 'tag_link',
        entity_id: 'TL1',
        action: 'create',
        after_json: JSON.stringify({ id: 'TL1', tag_id: 'TG1' }),
      }),
      entry({
        id: 'AL2',
        entity_name: 'tag_link',
        entity_id: 'TL1',
        action: 'delete',
        before_json: JSON.stringify({ id: 'TL1', tag_id: 'TG1' }),
        after_json: '',
      }),
    ])

    expect(diff.rowsBySheet.tag_links).toBeUndefined()
  })

  it('drops a row whose edits were all reverted', () => {
    const diff = computeSaveDiff([
      entry({
        id: 'AL1',
        entity_name: 'tag',
        entity_id: 'TG1',
        before_json: JSON.stringify({ id: 'TG1', name: 'Vip' }),
        after_json: JSON.stringify({ id: 'TG1', name: 'VIP' }),
      }),
      entry({
        id: 'AL2',
        entity_name: 'tag',
        entity_id: 'TG1',
        before_json: JSON.stringify({ id: 'TG1', name: 'VIP' }),
        after_json: JSON.stringify({ id: 'TG1', name: 'Vip' }),
      }),
    ])

    expect(diff.rowsBySheet.tags).toBeUndefined()
    expect(diff.newAuditEntries).toHaveLength(2)
  })

  it('keeps rows of different sheets apart', () => {
    const diff = computeSaveDiff([
      entry({
        id: 'AL1',
        entity_name: 'tag',
        entity_id: 'X1',
        before_json: JSON.stringify({ id: 'X1', name: 'a' }),
        after_json: JSON.stringify({ id: 'X1', name: 'b' }),
      }),
      entry({
        id: 'AL2',
        entity_name: 'job',
        entity_id: 'X1',
        before_json: JSON.stringify({ id: 'X1', description: 'a' }),
        after_json: JSON.stringify({ id: 'X1', description: 'b' }),
      }),
    ])

    expect(diff.rowsBySheet.tags).toHaveLength(1)
    expect(diff.rowsBySheet.jobs).toHaveLength(1)
  })

  it('ignores entries without an entity reference', () => {
    const diff = computeSaveDiff([
      entry({ entity_name: '', entity_id: '' }),
      entry({ id: 'AL2', entity_name: 'tag', entity_id: '' }),
    ])

    expect(diff.rowsBySheet).toEqual({})
    expect(diff.newAuditEntries).toHaveLength(2)
  })

  it('ignores entries naming an entity it knows no sheet for', () => {
    const diff = computeSaveDiff([
      entry({ entity_name: 'mystery', entity_id: 'M1', after_json: '{"id":"M1"}' }),
    ])

    expect(diff.rowsBySheet).toEqual({})
  })

  it('reads unreadable snapshots as empty and coerces non-string values', () => {
    const diff = computeSaveDiff([
      entry({
        entity_name: 'tag',
        entity_id: 'TG1',
        before_json: 'not-json',
        after_json: JSON.stringify({ id: 'TG1', name: 7, archived: null }),
      }),
    ])

    const rows = diff.rowsBySheet.tags ?? []
    expect(rows).toHaveLength(1)
    const name = rows[0].fields.find((field) => field.column === 'name')
    expect(name?.after).toBe('7')
    const archived = rows[0].fields.find((field) => field.column === 'archived')
    expect(archived?.after).toBe('null')
  })

  it('treats a non-object snapshot as empty', () => {
    const diff = computeSaveDiff([
      entry({
        entity_name: 'tag',
        entity_id: 'TG1',
        before_json: '[1,2]',
        after_json: JSON.stringify({ id: 'TG1', name: 'Vip' }),
      }),
    ])

    expect(diff.rowsBySheet.tags?.[0].action).toBe('modified')
    expect(diff.rowsBySheet.tags?.[0].fields.find((f) => f.column === 'name')?.before).toBe('')
  })
})
