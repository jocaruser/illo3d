import type { SheetRecord } from './SheetEntity'

export const AUDIT_ENTITY_NAMES = [
  'client',
  'crm_note',
  'tag',
  'tag_link',
  'job',
  'piece',
  'piece_item',
  'inventory',
  'lot',
  'transaction',
] as const

export type AuditEntityName = (typeof AUDIT_ENTITY_NAMES)[number]

/**
 * `migration` entries are baseline snapshots backfilled by the migration
 * wizard for rows that existed before auditing was introduced.
 */
export const AUDIT_ACTIONS = ['create', 'update', 'archive', 'delete', 'restore', 'migration'] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

/**
 * One immutable audit_log row. Unlike domain entities, audit entries carry no
 * lifecycle columns — the log is append-only.
 */
export class AuditEntry {
  id = ''
  /** ISO 8601 instant. */
  timestamp = ''
  /** Google account email, or `local` on the local backend, or `migration`. */
  actor = ''
  entityName: AuditEntityName | '' = ''
  entityId = ''
  action: AuditAction | '' = ''
  /** Full JSON snapshot of the row before the change ('' for create/migration). */
  beforeJson = ''
  /** Full JSON snapshot of the row after the change ('' for hard delete). */
  afterJson = ''
  /** Semicolon-separated list of column names whose values changed. */
  fieldsChanged = ''
  /** Set on cascaded operations: the immediate parent that triggered the change. */
  parentEntityName: AuditEntityName | '' = ''
  parentEntityId = ''

  static fromRecord(record: SheetRecord): AuditEntry {
    const entry = new AuditEntry()
    entry.id = record.id ?? ''
    entry.timestamp = record.timestamp ?? ''
    entry.actor = record.actor ?? ''
    entry.entityName = (record.entity_name ?? '') as AuditEntry['entityName']
    entry.entityId = record.entity_id ?? ''
    entry.action = (record.action ?? '') as AuditEntry['action']
    entry.beforeJson = record.before_json ?? ''
    entry.afterJson = record.after_json ?? ''
    entry.fieldsChanged = record.fieldsChanged ?? ''
    entry.parentEntityName = (record.parent_entity_name ?? '') as AuditEntry['parentEntityName']
    entry.parentEntityId = record.parent_entity_id ?? ''
    return entry
  }

  toRecord(): SheetRecord {
    return {
      id: this.id,
      timestamp: this.timestamp,
      actor: this.actor,
      entity_name: this.entityName,
      entity_id: this.entityId,
      action: this.action,
      before_json: this.beforeJson,
      after_json: this.afterJson,
      fieldsChanged: this.fieldsChanged,
      parent_entity_name: this.parentEntityName,
      parent_entity_id: this.parentEntityId,
    }
  }
}
