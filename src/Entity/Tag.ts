import { SheetEntity, type SheetRecord } from './SheetEntity'

export class Tag extends SheetEntity {
  id = ''
  name = ''
  createdAt = ''

  static fromRecord(record: SheetRecord): Tag {
    const tag = new Tag()
    tag.id = record.id ?? ''
    tag.name = record.name ?? ''
    tag.createdAt = record.created_at ?? ''
    tag.archived = record.archived ?? ''
    tag.deleted = record.deleted ?? ''
    return tag
  }

  toRecord(): SheetRecord {
    return {
      id: this.id,
      name: this.name,
      created_at: this.createdAt,
      archived: this.archived,
      deleted: this.deleted,
    }
  }
}
