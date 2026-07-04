import type { AuditEntityName, AuditLogEntry } from '@/types/money'
import type { AuditEvent, AuditSnapshot } from './auditEvent'

function snapshotToJson(snapshot: AuditSnapshot | null | undefined): string | null {
  if (!snapshot) return null
  return JSON.stringify(snapshot)
}

export function createAuditEntry(
  id: string,
  timestamp: string,
  actor: string,
  event: AuditEvent
): AuditLogEntry {
  return {
    id,
    timestamp,
    actor,
    entity_name: event.entityName,
    entity_id: event.entityId,
    action: event.action,
    before_json: snapshotToJson(event.before),
    after_json: snapshotToJson(event.after),
    parent_entity_name: event.parentEntityName ?? null,
    parent_entity_id: event.parentEntityId ?? null,
  }
}

export function auditEntryToRow(
  entry: AuditLogEntry
): Record<string, unknown> {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    actor: entry.actor,
    entity_name: entry.entity_name,
    entity_id: entry.entity_id,
    action: entry.action,
    before_json: entry.before_json ?? '',
    after_json: entry.after_json ?? '',
    parent_entity_name: entry.parent_entity_name ?? '',
    parent_entity_id: entry.parent_entity_id ?? '',
  }
}

export function parseAuditEntityName(raw: string | null | undefined): AuditEntityName | null {
  const value = raw?.trim() ?? ''
  const valid: AuditEntityName[] = [
    'client',
    'job',
    'piece',
    'piece_item',
    'inventory',
    'lot',
    'transaction',
    'tag',
    'tag_link',
    'crm_note',
  ]
  if (valid.includes(value as AuditEntityName)) return value as AuditEntityName
  return null
}
