import { CrmNote, type NoteEntityType } from '@/Entity/CrmNote'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { AbstractSheetRepository } from './AbstractSheetRepository'

export class CrmNoteRepository extends AbstractSheetRepository<CrmNote> {
  protected readonly sheet = 'crm_notes' as const
  protected readonly auditEntityName = 'crm_note' as const
  // Note ids are scope-prefixed: CN for client notes, JN for job notes.
  protected readonly idPrefix = 'CN'

  protected hydrate(record: SheetRecord): CrmNote {
    return CrmNote.fromRecord(record)
  }

  nextIdFor(entityType: NoteEntityType): string {
    const prefix = entityType === 'client' ? 'CN' : 'JN'
    const ids = this.findAll().map((note) => note.id)
    let highest = 0
    const pattern = new RegExp(`^${prefix}(\\d+)$`)
    for (const id of ids) {
      const match = pattern.exec(id)
      if (match && Number(match[1]) > highest) highest = Number(match[1])
    }
    return `${prefix}${highest + 1}`
  }

  findActiveByEntity(entityType: NoteEntityType, entityId: string): CrmNote[] {
    return this.findActive().filter(
      (note) => note.entityType === entityType && note.entityId === entityId,
    )
  }

  findByEntity(entityType: NoteEntityType, entityId: string): CrmNote[] {
    return this.findAll().filter(
      (note) => note.entityType === entityType && note.entityId === entityId,
    )
  }
}
