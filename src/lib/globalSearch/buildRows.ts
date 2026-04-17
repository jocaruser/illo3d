import type {
  Client,
  CrmNote,
  Inventory,
  Job,
  Piece,
  Tag,
  TagLink,
  Transaction,
} from '@/types/money'
import { formatTagNameTitleCase } from '@/utils/tagNameFormat'
import {
  buildClientSearchBlob,
  buildCrmNoteSearchBlob,
  buildInventorySearchBlob,
  buildJobSearchBlob,
  buildPieceSearchBlob,
  buildTagSearchBlob,
  buildTransactionSearchBlob,
} from '@/lib/listTable/searchBlobs'
import { tagNavigatePath } from '@/lib/globalSearch/tagNavigatePath'
import type { GlobalSearchRow, GlobalSearchTranslate } from '@/lib/globalSearch/types'

export interface GlobalSearchSourceData {
  clients: Client[]
  jobs: Job[]
  pieces: Piece[]
  crmNotes: CrmNote[]
  transactions: Transaction[]
  inventory: Inventory[]
  tags: Tag[]
  tagLinks: TagLink[]
}

function clientName(clients: Client[], clientId: string): string {
  return clients.find((c) => c.id === clientId)?.name ?? clientId
}

function jobLabel(jobs: Job[], jobId: string): string {
  const j = jobs.find((x) => x.id === jobId)
  if (!j) {
    return jobId
  }
  return `${j.id} — ${j.description}`
}

function buildTagSearchMaps(
  tags: Tag[],
  tagLinks: TagLink[]
): { byClientId: Map<string, string>; byJobId: Map<string, string> } {
  const namesByClient = new Map<string, string[]>()
  const namesByJob = new Map<string, string[]>()
  for (const link of tagLinks) {
    const tag = tags.find((x) => x.id === link.tag_id)
    const label = tag?.name?.trim()
    if (!label) {
      continue
    }
    const formatted = formatTagNameTitleCase(label)
    if (link.entity_type === 'client') {
      const list = namesByClient.get(link.entity_id) ?? []
      list.push(formatted)
      namesByClient.set(link.entity_id, list)
    } else if (link.entity_type === 'job') {
      const list = namesByJob.get(link.entity_id) ?? []
      list.push(formatted)
      namesByJob.set(link.entity_id, list)
    }
  }
  const byClientId = new Map<string, string>()
  const byJobId = new Map<string, string>()
  for (const [id, names] of namesByClient) {
    byClientId.set(id, names.join(' '))
  }
  for (const [id, names] of namesByJob) {
    byJobId.set(id, names.join(' '))
  }
  return { byClientId, byJobId }
}

function notePrimaryLine(body: string): string {
  const oneLine = body.replace(/\s+/g, ' ').trim()
  if (!oneLine) {
    return '—'
  }
  return oneLine.length > 80 ? `${oneLine.slice(0, 77)}…` : oneLine
}

export function buildGlobalSearchRows(
  data: GlobalSearchSourceData,
  t: GlobalSearchTranslate
): GlobalSearchRow[] {
  const {
    clients,
    jobs,
    pieces,
    crmNotes,
    transactions,
    inventory,
    tags,
    tagLinks,
  } = data
  const { byClientId, byJobId } = buildTagSearchMaps(tags, tagLinks)
  const rows: GlobalSearchRow[] = []

  for (const client of clients) {
    rows.push({
      blob: buildClientSearchBlob(client, byClientId.get(client.id)),
      hit: {
        kind: 'client',
        id: client.id,
        navigateTo: `/clients/${client.id}`,
        primaryLine: client.name,
        secondaryLine: [client.id, client.email].filter(Boolean).join(' · ') || undefined,
      },
    })
  }

  for (const job of jobs) {
    rows.push({
      blob: buildJobSearchBlob(job, {
        clientName: clientName(clients, job.client_id),
        statusLabel: t(`jobs.status.${job.status}`),
        tagNamesSearchLine: byJobId.get(job.id),
      }),
      hit: {
        kind: 'job',
        id: job.id,
        navigateTo: `/jobs/${job.id}`,
        primaryLine: job.description,
        secondaryLine: clientName(clients, job.client_id),
      },
    })
  }

  for (const piece of pieces) {
    rows.push({
      blob: buildPieceSearchBlob(piece, {
        jobLabel: jobLabel(jobs, piece.job_id),
        statusLabel: t(`pieces.status.${piece.status}`),
      }),
      hit: {
        kind: 'piece',
        id: piece.id,
        navigateTo: `/jobs/${piece.job_id}`,
        primaryLine: piece.name,
        secondaryLine: jobLabel(jobs, piece.job_id),
      },
    })
  }

  for (const note of crmNotes) {
    const severityLabel = t(`clientDetail.severity.${note.severity}`)
    if (note.entity_type === 'client') {
      const parent = clientName(clients, note.entity_id)
      rows.push({
        blob: buildCrmNoteSearchBlob(note, {
          severityLabel,
          parentLabel: parent,
        }),
        noteBody: note.body,
        hit: {
          kind: 'client_note',
          id: note.id,
          navigateTo: `/clients/${note.entity_id}`,
          primaryLine: notePrimaryLine(note.body),
          secondaryLine: parent,
        },
      })
    } else {
      const parent = jobLabel(jobs, note.entity_id)
      rows.push({
        blob: buildCrmNoteSearchBlob(note, {
          severityLabel,
          parentLabel: parent,
        }),
        noteBody: note.body,
        hit: {
          kind: 'job_note',
          id: note.id,
          navigateTo: `/jobs/${note.entity_id}`,
          primaryLine: notePrimaryLine(note.body),
          secondaryLine: parent,
        },
      })
    }
  }

  for (const tx of transactions) {
    rows.push({
      blob: buildTransactionSearchBlob(tx, {
        typeLabel: t(`transactions.type.${tx.type}`),
        clientLabel:
          clientName(clients, tx.client_id ?? '') || (tx.client_id ?? ''),
      }),
      hit: {
        kind: 'transaction',
        id: tx.id,
        navigateTo: '/transactions',
        primaryLine: tx.concept,
        secondaryLine: tx.date,
      },
    })
  }

  for (const item of inventory) {
    rows.push({
      blob: buildInventorySearchBlob(item, {
        typeLabel: t(`inventory.type.${item.type}`),
      }),
      hit: {
        kind: 'inventory',
        id: item.id,
        navigateTo: '/inventory',
        primaryLine: item.name,
        secondaryLine: t(`inventory.type.${item.type}`),
      },
    })
  }

  for (const tag of tags) {
    const path = tagNavigatePath(tagLinks, tag.id)
    rows.push({
      blob: buildTagSearchBlob(tag),
      hit: {
        kind: 'tag',
        id: tag.id,
        navigateTo: path,
        primaryLine: formatTagNameTitleCase(tag.name),
      },
    })
  }

  return rows
}
