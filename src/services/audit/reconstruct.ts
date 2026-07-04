import { useWorkbookStore } from '@/stores/workbookStore'
import type { CrmNote, CrmNoteEntityType, TagLink, TagEntityType } from '@/types/money'
import { parseClientNoteSeverity } from '@/services/clientNote/severity'

interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  entity_name: string
  entity_id: string
  action: string
  before_json: string | null
  after_json: string | null
  parent_entity_name: string | null
  parent_entity_id: string | null
}

function parseAuditLog(): AuditEntry[] {
  const matrix = useWorkbookStore.getState().tabs.audit_log
  if (!matrix || matrix.length < 2) return []
  const headers = matrix[0]
  const entries: AuditEntry[] = []
  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i]
    if (row.every((c) => c === '')) continue
    const get = (name: string): string | null => {
      const idx = headers.indexOf(name)
      if (idx === -1) return null
      const value = row[idx]
      return value === undefined || value === null || value === '' ? null : value
    }
    entries.push({
      id: get('id') ?? '',
      timestamp: get('timestamp') ?? '',
      actor: get('actor') ?? '',
      entity_name: get('entity_name') ?? '',
      entity_id: get('entity_id') ?? '',
      action: get('action') ?? '',
      before_json: get('before_json'),
      after_json: get('after_json'),
      parent_entity_name: get('parent_entity_name'),
      parent_entity_id: get('parent_entity_id'),
    })
  }
  return entries
}

export function getCurrentNotesForEntity(
  entityType: CrmNoteEntityType,
  entityId: string
): CrmNote[] {
  const entries = parseAuditLog()
  const notesById = new Map<string, CrmNote>()

  for (const entry of entries) {
    if (entry.entity_name !== 'crm_note' || !entry.after_json) continue
    try {
      const after = JSON.parse(entry.after_json) as Record<string, unknown>
      if (String(after.entity_type ?? '') !== entityType) continue
      if (String(after.entity_id ?? '') !== entityId) continue

      const id = String(after.id ?? '')
      if (!id) continue

      const severity = parseClientNoteSeverity(String(after.severity ?? ''))
      if (!severity) continue

      const note: CrmNote = {
        id,
        entity_type: entityType,
        entity_id: entityId,
        body: String(after.body ?? ''),
        referenced_entity_ids: String(after.referenced_entity_ids ?? ''),
        severity,
        created_at: String(after.created_at ?? ''),
      }
      if (after.archived) note.archived = String(after.archived)
      if (after.deleted) note.deleted = String(after.deleted)

      const prev = notesById.get(id)
      if (!prev || entry.timestamp >= prev.created_at) {
        notesById.set(id, note)
      }
    } catch {
      continue
    }
  }

  return Array.from(notesById.values())
    .filter((n) => !n.archived && !n.deleted)
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}

export function getCurrentTagLinksForEntity(
  entityType: TagEntityType,
  entityId: string
): TagLink[] {
  const entries = parseAuditLog()
  const linksById = new Map<string, TagLink>()

  for (const entry of entries) {
    if (entry.entity_name !== 'tag_link') continue

    if (entry.action === 'delete' && entry.before_json) {
      try {
        const before = JSON.parse(entry.before_json) as Record<string, unknown>
        const id = String(before.id ?? '')
        if (id) linksById.delete(id)
      } catch {
        continue
      }
      continue
    }

    if (!entry.after_json) continue
    try {
      const after = JSON.parse(entry.after_json) as Record<string, unknown>
      if (String(after.entity_type ?? '') !== entityType) continue
      if (String(after.entity_id ?? '') !== entityId) continue

      const id = String(after.id ?? '')
      const tagId = String(after.tag_id ?? '')
      if (!id || !tagId) continue

      const link: TagLink = {
        id,
        tag_id: tagId,
        entity_type: entityType,
        entity_id: entityId,
        created_at: String(after.created_at ?? ''),
      }
      if (after.archived) link.archived = String(after.archived)
      if (after.deleted) link.deleted = String(after.deleted)

      linksById.set(id, link)
    } catch {
      continue
    }
  }

  return Array.from(linksById.values())
    .filter((l) => !l.archived && !l.deleted)
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function getAllCurrentNotes(): CrmNote[] {
  const entries = parseAuditLog()
  const notesById = new Map<string, CrmNote>()

  for (const entry of entries) {
    if (entry.entity_name !== 'crm_note') continue

    if (entry.action === 'delete' && entry.before_json) {
      try {
        const before = JSON.parse(entry.before_json) as Record<string, unknown>
        const id = String(before.id ?? '')
        if (id) notesById.delete(id)
      } catch {
        continue
      }
      continue
    }

    if (!entry.after_json) continue
    try {
      const after = JSON.parse(entry.after_json) as Record<string, unknown>
      const id = String(after.id ?? '')
      if (!id) continue

      const entityType = String(after.entity_type ?? '')
      if (entityType !== 'client' && entityType !== 'job') continue

      const severity = parseClientNoteSeverity(String(after.severity ?? ''))
      if (!severity) continue

      const note: CrmNote = {
        id,
        entity_type: entityType,
        entity_id: String(after.entity_id ?? ''),
        body: String(after.body ?? ''),
        referenced_entity_ids: String(after.referenced_entity_ids ?? ''),
        severity,
        created_at: String(after.created_at ?? ''),
      }
      if (after.archived) note.archived = String(after.archived)
      if (after.deleted) note.deleted = String(after.deleted)

      const prev = notesById.get(id)
      if (!prev || entry.timestamp >= prev.created_at) {
        notesById.set(id, note)
      }
    } catch {
      continue
    }
  }

  return Array.from(notesById.values())
    .filter((n) => !n.archived && !n.deleted)
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}

export function getNoteById(noteId: string): CrmNote | null {
  const entries = parseAuditLog()
  let latest: CrmNote | null = null
  let latestTimestamp = ''

  for (const entry of entries) {
    if (entry.entity_name !== 'crm_note' || !entry.after_json) continue
    try {
      const after = JSON.parse(entry.after_json) as Record<string, unknown>
      if (String(after.id ?? '') !== noteId) continue

      const entityType = String(after.entity_type ?? '')
      if (entityType !== 'client' && entityType !== 'job') continue

      const severity = parseClientNoteSeverity(String(after.severity ?? ''))
      if (!severity) continue

      if (entry.timestamp >= latestTimestamp) {
        latestTimestamp = entry.timestamp
        latest = {
          id: noteId,
          entity_type: entityType,
          entity_id: String(after.entity_id ?? ''),
          body: String(after.body ?? ''),
          referenced_entity_ids: String(after.referenced_entity_ids ?? ''),
          severity,
          created_at: String(after.created_at ?? ''),
          archived: after.archived ? String(after.archived) : undefined,
          deleted: after.deleted ? String(after.deleted) : undefined,
        }
      }
    } catch {
      continue
    }
  }

  return latest
}

export function getAllNotesForEntity(
  entityType: CrmNoteEntityType,
  entityId: string
): CrmNote[] {
  return getCurrentNotesForEntity(entityType, entityId)
}

export function getAllCurrentTagLinks(): TagLink[] {
  const entries = parseAuditLog()
  const linksById = new Map<string, TagLink>()

  for (const entry of entries) {
    if (entry.entity_name !== 'tag_link') continue

    if (entry.action === 'delete' && entry.before_json) {
      try {
        const before = JSON.parse(entry.before_json) as Record<string, unknown>
        const id = String(before.id ?? '')
        if (id) linksById.delete(id)
      } catch {
        continue
      }
      continue
    }

    if (!entry.after_json) continue
    try {
      const after = JSON.parse(entry.after_json) as Record<string, unknown>
      const id = String(after.id ?? '')
      const tagId = String(after.tag_id ?? '')
      if (!id || !tagId) continue
      const entityType = String(after.entity_type ?? '')
      if (entityType !== 'client' && entityType !== 'job') continue
      const link: TagLink = {
        id,
        tag_id: tagId,
        entity_type: entityType,
        entity_id: String(after.entity_id ?? ''),
        created_at: String(after.created_at ?? ''),
      }
      if (after.archived) link.archived = String(after.archived)
      if (after.deleted) link.deleted = String(after.deleted)
      linksById.set(id, link)
    } catch {
      continue
    }
  }

  return Array.from(linksById.values())
    .filter((l) => !l.archived && !l.deleted)
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function getTagLinkById(linkId: string): TagLink | null {
  const entries = parseAuditLog()

  for (const entry of entries) {
    if (entry.entity_name !== 'tag_link') continue

    if (entry.action === 'delete' && entry.before_json) {
      try {
        const before = JSON.parse(entry.before_json) as Record<string, unknown>
        if (String(before.id ?? '') === linkId) return null
      } catch {
        continue
      }
      continue
    }

    if (!entry.after_json) continue
    try {
      const after = JSON.parse(entry.after_json) as Record<string, unknown>
      if (String(after.id ?? '') !== linkId) continue
      const entityType = String(after.entity_type ?? '')
      if (entityType !== 'client' && entityType !== 'job') continue
      return {
        id: linkId,
        tag_id: String(after.tag_id ?? ''),
        entity_type: entityType,
        entity_id: String(after.entity_id ?? ''),
        created_at: String(after.created_at ?? ''),
        archived: after.archived ? String(after.archived) : undefined,
        deleted: after.deleted ? String(after.deleted) : undefined,
      }
    } catch {
      continue
    }
  }

  return null
}

export function getAllTagLinksForEntity(
  entityType: TagEntityType,
  entityId: string
): TagLink[] {
  return getCurrentTagLinksForEntity(entityType, entityId)
}
