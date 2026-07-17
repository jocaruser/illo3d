import type { Client } from '@/Entity/Client'
import type { Job } from '@/Entity/Job'
import type { TagLink } from '@/Entity/TagLink'
import type { EntityManager } from '@/Repository/EntityManager'
import { formatTagNameTitleCase } from '@/Service/TagService'
import { fuzzyFilter } from './fuzzyFilter'
import {
  clientSearchBlob,
  crmNoteSearchBlob,
  inventorySearchBlob,
  jobSearchBlob,
  pieceSearchBlob,
  tagSearchBlob,
  transactionSearchBlob,
  type Translate,
} from './searchBlobs'

export const GLOBAL_SEARCH_MAX_RESULTS = 10

export type GlobalSearchKind =
  | 'client'
  | 'job'
  | 'piece'
  | 'client_note'
  | 'job_note'
  | 'transaction'
  | 'inventory'
  | 'tag'

export interface GlobalSearchHit {
  kind: GlobalSearchKind
  id: string
  /** Hash-route path, e.g. '/clients/CL1'. */
  navigateTo: string
  primaryLine: string
  secondaryLine?: string
}

interface SearchRow {
  blob: string
  hit: GlobalSearchHit
}

function clientName(clients: Client[], clientId: string): string {
  return clients.find((client) => client.id === clientId)?.name ?? clientId
}

function jobLabel(jobs: Job[], jobId: string): string {
  const job = jobs.find((candidate) => candidate.id === jobId)
  return job ? `${job.id} — ${job.description}` : jobId
}

function noteLine(body: string): string {
  const oneLine = body.replace(/\s+/g, ' ').trim()
  if (oneLine === '') return '—'
  return oneLine.length > 80 ? `${oneLine.slice(0, 77)}…` : oneLine
}

/** Tags land on the list page of whichever entity type they are linked to. */
function tagNavigatePath(links: TagLink[], tagId: string): string {
  const mine = links.filter((link) => link.tagId === tagId)
  if (mine.some((link) => link.entityType === 'client')) return '/clients'
  if (mine.some((link) => link.entityType === 'job')) return '/jobs'
  return '/clients'
}

function tagNamesLine(
  links: TagLink[],
  tagNameById: Map<string, string>,
  entityType: 'client' | 'job',
  entityId: string
): string | undefined {
  const names: string[] = []
  for (const link of links) {
    if (link.entityType !== entityType || link.entityId !== entityId) continue
    const name = tagNameById.get(link.tagId)?.trim() ?? ''
    if (name !== '') names.push(formatTagNameTitleCase(name))
  }
  return names.length > 0 ? names.join(' ') : undefined
}

function buildRows(em: EntityManager, t: Translate): SearchRow[] {
  const clients = em.clients.findActive()
  const jobs = em.jobs.findActive()
  const tags = em.tags.findActive()
  const tagLinks = em.tagLinks.findActive()
  const tagNameById = new Map(tags.map((tag) => [tag.id, tag.name]))
  const rows: SearchRow[] = []

  for (const client of clients) {
    rows.push({
      blob: clientSearchBlob(
        client,
        tagNamesLine(tagLinks, tagNameById, 'client', client.id)
      ),
      hit: {
        kind: 'client',
        id: client.id,
        navigateTo: `/clients/${client.id}`,
        primaryLine: client.name,
        secondaryLine: [client.id, client.email]
          .filter((part) => part !== '')
          .join(' · '),
      },
    })
  }

  for (const job of jobs) {
    rows.push({
      blob: jobSearchBlob(
        job,
        {
          clientName: clientName(clients, job.clientId),
          tagNamesLine: tagNamesLine(tagLinks, tagNameById, 'job', job.id),
        },
        t
      ),
      hit: {
        kind: 'job',
        id: job.id,
        navigateTo: `/jobs/${job.id}`,
        primaryLine: job.description,
        secondaryLine: clientName(clients, job.clientId),
      },
    })
  }

  for (const piece of em.pieces.findActive()) {
    rows.push({
      blob: pieceSearchBlob(
        piece,
        { jobLabel: jobLabel(jobs, piece.jobId) },
        t
      ),
      hit: {
        kind: 'piece',
        id: piece.id,
        navigateTo: `/jobs/${piece.jobId}`,
        primaryLine: piece.name,
        secondaryLine: jobLabel(jobs, piece.jobId),
      },
    })
  }

  for (const note of em.crmNotes.findActive()) {
    const isClientNote = note.entityType === 'client'
    const parentLabel = isClientNote
      ? clientName(clients, note.entityId)
      : jobLabel(jobs, note.entityId)
    rows.push({
      blob: crmNoteSearchBlob(note, { parentLabel }, t),
      hit: {
        kind: isClientNote ? 'client_note' : 'job_note',
        id: note.id,
        navigateTo: isClientNote
          ? `/clients/${note.entityId}`
          : `/jobs/${note.entityId}`,
        primaryLine: noteLine(note.body),
        secondaryLine: parentLabel,
      },
    })
  }

  for (const transaction of em.transactions.findActive()) {
    rows.push({
      blob: transactionSearchBlob(
        transaction,
        { clientLabel: clientName(clients, transaction.clientId) },
        t
      ),
      hit: {
        kind: 'transaction',
        id: transaction.id,
        navigateTo: '/transactions',
        primaryLine: transaction.concept,
        secondaryLine: transaction.date,
      },
    })
  }

  for (const item of em.inventory.findActive()) {
    rows.push({
      blob: inventorySearchBlob(item, t),
      hit: {
        kind: 'inventory',
        id: item.id,
        navigateTo: `/inventory/${item.id}`,
        primaryLine: item.name,
        secondaryLine: t(`inventory.type.${item.type}`),
      },
    })
  }

  for (const tag of tags) {
    rows.push({
      blob: tagSearchBlob(tag),
      hit: {
        kind: 'tag',
        id: tag.id,
        navigateTo: tagNavigatePath(tagLinks, tag.id),
        primaryLine: formatTagNameTitleCase(tag.name),
      },
    })
  }

  return rows
}

/** Deterministic codepoint ordering by kind then id (locale collation would reorder '_'). */
function tieBreak(a: SearchRow, b: SearchRow): number {
  if (a.hit.kind !== b.hit.kind) return a.hit.kind < b.hit.kind ? -1 : 1
  if (a.hit.id !== b.hit.id) return a.hit.id < b.hit.id ? -1 : 1
  return 0
}

/**
 * Global fuzzy search across every active entity in the snapshot: at most 10
 * results, exact id matches first, deterministic kind+id tiebreak.
 */
export function globalSearch(
  em: EntityManager,
  query: string,
  t: Translate
): GlobalSearchHit[] {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const matched = fuzzyFilter(buildRows(em, t), trimmed, (row) => row.blob)
  const exact = matched.filter((row) => row.hit.id === trimmed).sort(tieBreak)
  const fuzzy = matched.filter((row) => row.hit.id !== trimmed).sort(tieBreak)
  return [...exact, ...fuzzy]
    .slice(0, GLOBAL_SEARCH_MAX_RESULTS)
    .map((row) => row.hit)
}
