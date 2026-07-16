import type { NoteSeverity } from '@/Entity/CrmNote'
import type { Job, JobStatus } from '@/Entity/Job'
import type { EntityManager } from '@/Repository/EntityManager'

export type ClientActivityEntry =
  | { kind: 'income'; id: string; at: string; transactionId: string; amount: number; concept: string }
  | { kind: 'tag'; id: string; at: string; linkId: string; tagId: string; tagName: string }
  | {
      kind: 'job_note'
      id: string
      at: string
      noteId: string
      jobId: string
      jobDescription: string
      body: string
      severity: NoteSeverity
    }
  | {
      kind: 'client_note'
      id: string
      at: string
      noteId: string
      body: string
      severity: NoteSeverity
    }
  | {
      kind: 'job_created'
      id: string
      at: string
      jobId: string
      jobDescription: string
      status: JobStatus
    }

const KIND_PRIORITY: Record<ClientActivityEntry['kind'], number> = {
  income: 0,
  tag: 1,
  job_note: 2,
  client_note: 3,
  job_created: 4,
}

function sortMs(at: string): number {
  const parsed = Date.parse(at)
  return Number.isNaN(parsed) ? 0 : parsed
}

function jobLabel(job: Job): string {
  return job.description.trim() !== '' ? job.description.trim() : job.id
}

/**
 * Merged activity feed for a client detail page: the client's notes, notes on
 * the client's jobs, job-created events, income transactions and tag links —
 * active rows only, newest first with a fixed kind priority and id tiebreak.
 */
export function buildClientActivityTimeline(
  em: EntityManager,
  clientId: string,
): ClientActivityEntry[] {
  const entries: Array<{ entry: ClientActivityEntry; ms: number; tieId: string }> = []

  const clientJobs = em.jobs.findActiveByClient(clientId)

  for (const note of em.crmNotes.findActiveByEntity('client', clientId)) {
    entries.push({
      entry: {
        kind: 'client_note',
        id: `client_note-${note.id}`,
        at: note.createdAt,
        noteId: note.id,
        body: note.body,
        severity: note.severity,
      },
      ms: sortMs(note.createdAt),
      tieId: note.id,
    })
  }

  for (const job of clientJobs) {
    for (const note of em.crmNotes.findActiveByEntity('job', job.id)) {
      entries.push({
        entry: {
          kind: 'job_note',
          id: `job_note-${note.id}`,
          at: note.createdAt,
          noteId: note.id,
          jobId: job.id,
          jobDescription: jobLabel(job),
          body: note.body,
          severity: note.severity,
        },
        ms: sortMs(note.createdAt),
        tieId: note.id,
      })
    }
    entries.push({
      entry: {
        kind: 'job_created',
        id: `job_created-${job.id}`,
        at: job.createdAt,
        jobId: job.id,
        jobDescription: jobLabel(job),
        status: job.status,
      },
      ms: sortMs(job.createdAt),
      tieId: job.id,
    })
  }

  for (const transaction of em.transactions.findActiveIncomeByClient(clientId)) {
    entries.push({
      entry: {
        kind: 'income',
        id: `income-${transaction.id}`,
        at: transaction.date,
        transactionId: transaction.id,
        amount: transaction.amount ?? 0,
        concept: transaction.concept.trim(),
      },
      ms: sortMs(transaction.date),
      tieId: transaction.id,
    })
  }

  const tagNameById = new Map(em.tags.findActive().map((tag) => [tag.id, tag.name]))
  for (const link of em.tagLinks.findActiveByEntity('client', clientId)) {
    const tagName = tagNameById.get(link.tagId)?.trim()
    entries.push({
      entry: {
        kind: 'tag',
        id: `tag-${link.id}`,
        at: link.createdAt,
        linkId: link.id,
        tagId: link.tagId,
        tagName: tagName !== undefined && tagName !== '' ? tagName : link.tagId,
      },
      ms: sortMs(link.createdAt),
      tieId: link.id,
    })
  }

  entries.sort((a, b) => {
    if (a.ms !== b.ms) return b.ms - a.ms
    const priority = KIND_PRIORITY[a.entry.kind] - KIND_PRIORITY[b.entry.kind]
    if (priority !== 0) return priority
    return a.tieId.localeCompare(b.tieId)
  })

  return entries.map((item) => item.entry)
}
