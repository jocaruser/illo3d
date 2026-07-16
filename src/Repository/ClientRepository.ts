import { Client } from '@/Entity/Client'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { AbstractSheetRepository } from './AbstractSheetRepository'

export class ClientRepository extends AbstractSheetRepository<Client> {
  protected readonly sheet = 'clients' as const
  protected readonly auditEntityName = 'client' as const
  protected readonly idPrefix = 'CL'

  protected hydrate(record: SheetRecord): Client {
    return Client.fromRecord(record)
  }
}
