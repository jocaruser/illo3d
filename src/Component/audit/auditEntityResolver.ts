import type { AuditEntityName } from '@/Entity/AuditEntry'
import type { EntityManager } from '@/Repository/EntityManager'

export interface ResolvedAuditEntity {
  /** Human label: a live name, a name from the JSON snapshots, or the raw id. */
  label: string
  /** Router path, or null when the row resolves to nothing linkable. */
  to: string | null
}

/** Snapshot fields that carry a human name, in the order they are tried. */
const LABEL_FIELDS = ['name', 'description', 'concept'] as const

/**
 * Tier 1 — the entity still lives in the workbook, so it has an authoritative
 * name. Entities without a name-like column (lots, tag links, BOM lines) never
 * resolve here and fall through to their snapshot.
 */
function liveLabel(
  em: EntityManager,
  entityName: AuditEntityName | '',
  entityId: string
): string | null {
  switch (entityName) {
    case 'client':
      return blankToNull(em.clients.find(entityId)?.name)
    case 'job':
      return blankToNull(em.jobs.find(entityId)?.description)
    case 'piece':
      return blankToNull(em.pieces.find(entityId)?.name)
    case 'inventory':
      return blankToNull(em.inventory.find(entityId)?.name)
    case 'transaction':
      return blankToNull(em.transactions.find(entityId)?.concept)
    case 'tag':
      return blankToNull(em.tags.find(entityId)?.name)
    case 'crm_note':
      return blankToNull(em.crmNotes.find(entityId)?.body)
    default:
      return null
  }
}

/**
 * Tier 2 — the row is gone (or never had a live name), so read the name out of
 * the audit snapshots. `after_json` wins because it describes the row as the
 * change left it; `before_json` covers hard deletes, whose after snapshot is ''.
 */
function jsonLabel(beforeJson: string, afterJson: string): string | null {
  return snapshotLabel(afterJson) ?? snapshotLabel(beforeJson)
}

function snapshotLabel(json: string): string | null {
  if (json.trim() === '') return null
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }
  if (parsed === null || typeof parsed !== 'object') return null
  const record = parsed as Record<string, unknown>
  for (const field of LABEL_FIELDS) {
    const value = record[field]
    if (typeof value === 'string' && value.trim() !== '') return value
  }
  return null
}

/** Where a resolved entity of this type is read in the app, or null. */
function linkTarget(
  em: EntityManager,
  entityName: AuditEntityName | '',
  entityId: string
): string | null {
  switch (entityName) {
    case 'client':
      return `/clients/${entityId}`
    case 'job':
      return `/jobs/${entityId}`
    case 'piece': {
      // Pieces are read inside their job, so the job must still exist.
      const jobId = em.pieces.find(entityId)?.jobId ?? ''
      return jobId === '' ? null : `/jobs/${jobId}#piece-${entityId}`
    }
    case 'inventory':
      return `/inventory/${entityId}`
    case 'transaction':
      // Only expenses have a detail page; income rows are read-only list rows.
      return em.transactions.find(entityId)?.isExpense() === true
        ? `/transactions/${entityId}`
        : null
    default:
      // tag, tag_link, crm_note, lot and piece_item have no detail route.
      return null
  }
}

function blankToNull(value: string | undefined): string | null {
  return value === undefined || value.trim() === '' ? null : value
}

/**
 * Resolves an audit row's entity reference to display text and an optional
 * link, in three tiers:
 *
 *   1. live workbook lookup by entity name + id  → the current human name
 *   2. `after_json`, then `before_json`          → the name as it was recorded
 *   3. the raw id                                → never linked
 *
 * A row that only resolves to its raw id is deliberately not linked: we cannot
 * tell whether the target still exists, so we do not offer a dead end.
 */
export function resolveAuditEntity(
  em: EntityManager,
  entityName: AuditEntityName | '',
  entityId: string,
  beforeJson = '',
  afterJson = ''
): ResolvedAuditEntity {
  if (entityId === '') return { label: '', to: null }
  const resolved = liveLabel(em, entityName, entityId) ?? jsonLabel(beforeJson, afterJson)
  if (resolved === null) return { label: entityId, to: null }
  return { label: resolved, to: linkTarget(em, entityName, entityId) }
}
