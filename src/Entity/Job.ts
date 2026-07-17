import { SheetEntity, numericCell, parseNumericCell, type SheetRecord } from './SheetEntity'

export const JOB_STATUSES = ['draft', 'in_progress', 'delivered', 'paid', 'cancelled'] as const

export type JobStatus = (typeof JOB_STATUSES)[number]

export function parseJobStatus(value: string): JobStatus {
  return (JOB_STATUSES as readonly string[]).includes(value) ? (value as JobStatus) : 'draft'
}

export class Job extends SheetEntity {
  id = ''
  clientId = ''
  description = ''
  status: JobStatus = 'draft'
  /** Legacy job-level price; user-visible totals derive from pieces instead. */
  price: number | undefined = undefined
  /** Kanban ordering inside a column; lower sorts first. */
  boardOrder: number | undefined = undefined
  /** ISO instant. */
  createdAt = ''
  /** v3: optional `YYYY-MM-DD` due date; falls back to created_at when unset. */
  dueDate = ''

  /** Terminal-by-payment statuses count as completed work. */
  isCompleted(): boolean {
    return this.status === 'paid' || this.status === 'cancelled'
  }

  isOpen(): boolean {
    return this.status === 'draft' || this.status === 'in_progress'
  }

  /** Effective due date used by badges, kanban staleness and the calendar. */
  effectiveDueDate(): string {
    return this.dueDate !== '' ? this.dueDate : this.createdAt
  }

  static fromRecord(record: SheetRecord): Job {
    const job = new Job()
    job.id = record.id ?? ''
    job.clientId = record.client_id ?? ''
    job.description = record.description ?? ''
    job.status = parseJobStatus(record.status ?? '')
    job.price = parseNumericCell(record.price ?? '')
    job.boardOrder = parseNumericCell(record.board_order ?? '')
    job.createdAt = record.created_at ?? ''
    job.dueDate = record.due_date ?? ''
    job.archived = record.archived ?? ''
    job.deleted = record.deleted ?? ''
    return job
  }

  toRecord(): SheetRecord {
    return {
      id: this.id,
      client_id: this.clientId,
      description: this.description,
      status: this.status,
      price: numericCell(this.price),
      board_order: numericCell(this.boardOrder),
      created_at: this.createdAt,
      archived: this.archived,
      deleted: this.deleted,
      due_date: this.dueDate,
    }
  }
}
