import { CrmNote, isNoteSeverity, type NoteEntityType } from '@/Entity/CrmNote'
import type { EntityManager } from '@/Repository/EntityManager'
import { isoInstant } from './Clock'
import { referencedEntityIdsFromBody } from './Mention'

export type NoteResult = { ok: true; note: CrmNote } | { ok: false; error: string }

export class NoteService {
  constructor(private readonly em: EntityManager) {}

  createNote(
    entityType: NoteEntityType,
    entityId: string,
    body: string,
    severity: string,
  ): NoteResult {
    if (body.trim() === '') return { ok: false, error: 'purchase.validation.required' }
    if (!isNoteSeverity(severity)) return { ok: false, error: 'errors.actionFailed' }
    const note = new CrmNote()
    note.id = this.em.crmNotes.nextIdFor(entityType)
    note.entityType = entityType
    note.entityId = entityId
    note.body = body
    note.referencedEntityIds = referencedEntityIdsFromBody(body)
    note.severity = severity
    note.createdAt = isoInstant(this.em.clock)
    this.em.crmNotes.save(note)
    return { ok: true, note }
  }

  updateNote(id: string, body: string, severity: string): NoteResult {
    const note = this.em.crmNotes.find(id)
    if (note === null) return { ok: false, error: 'errors.actionFailed' }
    if (body.trim() === '') return { ok: false, error: 'purchase.validation.required' }
    if (!isNoteSeverity(severity)) return { ok: false, error: 'errors.actionFailed' }
    note.body = body
    note.referencedEntityIds = referencedEntityIdsFromBody(body)
    note.severity = severity
    this.em.crmNotes.save(note)
    return { ok: true, note }
  }

  /** Soft delete: the repository audits the lifecycle flip as a `delete`. */
  deleteNote(id: string): NoteResult {
    const note = this.em.crmNotes.find(id)
    if (note === null) return { ok: false, error: 'errors.actionFailed' }
    note.deleted = 'true'
    this.em.crmNotes.save(note)
    return { ok: true, note }
  }
}
