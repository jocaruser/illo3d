import { SheetEntity, type SheetRecord } from './SheetEntity'

export const NOTE_ENTITY_TYPES = ['client', 'job'] as const

export type NoteEntityType = (typeof NOTE_ENTITY_TYPES)[number]

export const NOTE_SEVERITIES = [
  'info',
  'danger',
  'warning',
  'success',
  'primary',
  'secondary',
] as const

export type NoteSeverity = (typeof NOTE_SEVERITIES)[number]

export function isNoteSeverity(value: string): value is NoteSeverity {
  return (NOTE_SEVERITIES as readonly string[]).includes(value)
}

/**
 * A CRM note attached to a client or a job. Client notes carry `CN`-prefixed
 * ids, job notes `JN`-prefixed ids. `referencedEntityIds` is derived from
 * `@`-mentions in the body (space-separated canonical ids, no `@`).
 */
export class CrmNote extends SheetEntity {
  id = ''
  entityType: NoteEntityType | '' = ''
  entityId = ''
  body = ''
  referencedEntityIds = ''
  severity: NoteSeverity = 'info'
  createdAt = ''

  /** Severities other than info/secondary surface as alert strips. */
  isProminent(): boolean {
    return this.severity !== 'info' && this.severity !== 'secondary'
  }

  static fromRecord(record: SheetRecord): CrmNote {
    const note = new CrmNote()
    note.id = record.id ?? ''
    note.entityType = (NOTE_ENTITY_TYPES as readonly string[]).includes(record.entity_type ?? '')
      ? ((record.entity_type ?? '') as NoteEntityType)
      : ''
    note.entityId = record.entity_id ?? ''
    note.body = record.body ?? ''
    note.referencedEntityIds = record.referenced_entity_ids ?? ''
    note.severity = isNoteSeverity(record.severity ?? '') ? (record.severity as NoteSeverity) : 'info'
    note.createdAt = record.created_at ?? ''
    note.archived = record.archived ?? ''
    note.deleted = record.deleted ?? ''
    return note
  }

  toRecord(): SheetRecord {
    return {
      id: this.id,
      entity_type: this.entityType,
      entity_id: this.entityId,
      body: this.body,
      referenced_entity_ids: this.referencedEntityIds,
      severity: this.severity,
      created_at: this.createdAt,
      archived: this.archived,
      deleted: this.deleted,
    }
  }
}
