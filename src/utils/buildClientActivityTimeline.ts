import { getTransactionConceptLink } from '@/lib/money/transactionConceptLink'
import { excludeArchivedDeleted } from '@/lib/globalSearch/activeEntities'
import type {
  ClientNoteSeverity,
  CrmNote,
  Job,
  JobStatus,
  Tag,
  TagLink,
  Transaction,
} from '@/types/money'

const NOTE_TRUNCATE_LEN = 160

export type ClientActivityEntryKind =
  | 'income'
  | 'tag'
  | 'job_note'
  | 'client_note'
  | 'job_created'

export type ClientActivityEntry =
  | {
      kind: 'client_note'
      id: string
      sortAt: string
      sortMs: number
      tieId: string
      noteId: string
      body: string
      bodyPreview: string
      severity: ClientNoteSeverity
    }
  | {
      kind: 'job_note'
      id: string
      sortAt: string
      sortMs: number
      tieId: string
      noteId: string
      jobId: string
      jobDescription: string
      body: string
      bodyPreview: string
      severity: ClientNoteSeverity
    }
  | {
      kind: 'job_created'
      id: string
      sortAt: string
      sortMs: number
      tieId: string
      jobId: string
      jobDescription: string
      status: JobStatus
    }
  | {
      kind: 'income'
      id: string
      sortAt: string
      sortMs: number
      tieId: string
      transactionId: string
      amount: number
      concept: string
      href: string | null
      linkTestId: string | null
    }
  | {
      kind: 'tag'
      id: string
      sortAt: string
      sortMs: number
      tieId: string
      linkId: string
      tagId: string
      tagName: string
    }

function kindPriority(k: ClientActivityEntryKind): number {
  switch (k) {
    case 'income':
      return 0
    case 'tag':
      return 1
    case 'job_note':
      return 2
    case 'client_note':
      return 3
    case 'job_created':
      return 4
  }
}

/** Transaction `date` may be YYYY-MM-DD; use UTC start-of-day for ordering. */
export function transactionDateToSortMs(date: string): number {
  const d = date.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  if (m) {
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  const p = Date.parse(d)
  return Number.isNaN(p) ? 0 : p
}

function isoToSortMs(iso: string): number {
  const p = Date.parse(iso)
  return Number.isNaN(p) ? 0 : p
}

function truncateBody(body: string): string {
  const t = body.trim()
  if (t.length <= NOTE_TRUNCATE_LEN) return t
  return `${t.slice(0, NOTE_TRUNCATE_LEN - 1)}…`
}

function jobLabel(job: Job): string {
  return job.description.trim() || job.id
}

export interface BuildClientActivityTimelineInput {
  clientId: string
  crmNotes: CrmNote[]
  jobs: Job[]
  transactions: Transaction[]
  tags: Tag[]
  tagLinks: TagLink[]
}

export function buildClientActivityTimeline(
  input: BuildClientActivityTimelineInput
): ClientActivityEntry[] {
  const { clientId } = input
  const crmNotes = excludeArchivedDeleted(input.crmNotes)
  const jobs = excludeArchivedDeleted(input.jobs)
  const transactions = excludeArchivedDeleted(input.transactions)
  const tagLinks = excludeArchivedDeleted(input.tagLinks)
  const tags = excludeArchivedDeleted(input.tags)

  const clientJobs = jobs.filter((j) => j.client_id === clientId)
  const jobIds = new Set(clientJobs.map((j) => j.id))
  const jobById = new Map(clientJobs.map((j) => [j.id, j]))

  const tagNameById = new Map(tags.map((t) => [t.id, t.name]))

  const entries: ClientActivityEntry[] = []

  for (const n of crmNotes) {
    if (n.entity_type === 'client' && n.entity_id === clientId) {
      const sortMs = isoToSortMs(n.created_at)
      entries.push({
        kind: 'client_note',
        id: `client_note-${n.id}`,
        sortAt: n.created_at,
        sortMs,
        tieId: n.id,
        noteId: n.id,
        body: n.body,
        bodyPreview: truncateBody(n.body),
        severity: n.severity,
      })
    } else if (n.entity_type === 'job' && jobIds.has(n.entity_id)) {
      const job = jobById.get(n.entity_id)
      if (!job) continue
      const sortMs = isoToSortMs(n.created_at)
      entries.push({
        kind: 'job_note',
        id: `job_note-${n.id}`,
        sortAt: n.created_at,
        sortMs,
        tieId: n.id,
        noteId: n.id,
        jobId: job.id,
        jobDescription: jobLabel(job),
        body: n.body,
        bodyPreview: truncateBody(n.body),
        severity: n.severity,
      })
    }
  }

  for (const job of clientJobs) {
    const sortMs = isoToSortMs(job.created_at)
    entries.push({
      kind: 'job_created',
      id: `job_created-${job.id}`,
      sortAt: job.created_at,
      sortMs,
      tieId: job.id,
      jobId: job.id,
      jobDescription: jobLabel(job),
      status: job.status,
    })
  }

  for (const tx of transactions) {
    if (tx.type !== 'income' || tx.client_id !== clientId) continue
    const sortMs = transactionDateToSortMs(tx.date)
    const link = getTransactionConceptLink(tx, undefined, undefined)
    entries.push({
      kind: 'income',
      id: `income-${tx.id}`,
      sortAt: tx.date,
      sortMs,
      tieId: tx.id,
      transactionId: tx.id,
      amount:
        typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0,
      concept: tx.concept?.trim() ?? '',
      href: link?.to ?? null,
      linkTestId: link?.testId ?? null,
    })
  }

  for (const link of tagLinks) {
    if (link.entity_type !== 'client' || link.entity_id !== clientId) continue
    const sortMs = isoToSortMs(link.created_at)
    const tagName = tagNameById.get(link.tag_id)?.trim() || link.tag_id
    entries.push({
      kind: 'tag',
      id: `tag-${link.id}`,
      sortAt: link.created_at,
      sortMs,
      tieId: link.id,
      linkId: link.id,
      tagId: link.tag_id,
      tagName,
    })
  }

  entries.sort((a, b) => {
    const td = b.sortMs - a.sortMs
    if (td !== 0) return td
    const kp = kindPriority(a.kind) - kindPriority(b.kind)
    if (kp !== 0) return kp
    return a.tieId.localeCompare(b.tieId)
  })

  return entries
}
