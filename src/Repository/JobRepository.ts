import { Job } from '@/Entity/Job'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { AbstractSheetRepository } from './AbstractSheetRepository'

export class JobRepository extends AbstractSheetRepository<Job> {
  protected readonly sheet = 'jobs' as const
  protected readonly auditEntityName = 'job' as const
  protected readonly idPrefix = 'J'

  protected hydrate(record: SheetRecord): Job {
    return Job.fromRecord(record)
  }

  findActiveByClient(clientId: string): Job[] {
    return this.findActive().filter((job) => job.clientId === clientId)
  }

  findByClient(clientId: string): Job[] {
    return this.findAll().filter((job) => job.clientId === clientId)
  }
}
