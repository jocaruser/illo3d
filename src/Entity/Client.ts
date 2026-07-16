import { SheetEntity, type SheetRecord } from './SheetEntity'

export class Client extends SheetEntity {
  id = ''
  name = ''
  email = ''
  phone = ''
  notes = ''
  preferredContact = ''
  leadSource = ''
  address = ''
  /** `YYYY-MM-DD` day string (historic client convention). */
  createdAt = ''

  static fromRecord(record: SheetRecord): Client {
    const client = new Client()
    client.id = record.id ?? ''
    client.name = record.name ?? ''
    client.email = record.email ?? ''
    client.phone = record.phone ?? ''
    client.notes = record.notes ?? ''
    client.preferredContact = record.preferred_contact ?? ''
    client.leadSource = record.lead_source ?? ''
    client.address = record.address ?? ''
    client.createdAt = record.created_at ?? ''
    client.archived = record.archived ?? ''
    client.deleted = record.deleted ?? ''
    return client
  }

  toRecord(): SheetRecord {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      notes: this.notes,
      preferred_contact: this.preferredContact,
      lead_source: this.leadSource,
      address: this.address,
      created_at: this.createdAt,
      archived: this.archived,
      deleted: this.deleted,
    }
  }
}
