import type { Client } from '@/Entity/Client'
import type { CrmNote } from '@/Entity/CrmNote'
import type { InventoryItem } from '@/Entity/InventoryItem'
import type { Job } from '@/Entity/Job'
import type { Piece } from '@/Entity/Piece'
import type { Tag } from '@/Entity/Tag'
import type { Transaction } from '@/Entity/Transaction'
import { formatTagNameTitleCase } from '@/Service/TagService'

export type Translate = (key: string) => string

export function joinSearchParts(parts: Iterable<string | undefined>): string {
  const chunks: string[] = []
  for (const part of parts) {
    if (part === undefined) continue
    const trimmed = part.trim()
    if (trimmed !== '') chunks.push(trimmed)
  }
  return chunks.join(' \n ')
}

/** Number spellings users type when searching money: raw, 2dp, comma decimals. */
export function moneySearchFragments(value: number | undefined): string[] {
  if (value === undefined) return []
  const fragments = new Set<string>([
    String(value),
    value.toFixed(2),
    value.toFixed(2).replace('.', ','),
  ])
  return [...fragments]
}

export function clientSearchBlob(client: Client, tagNamesLine?: string): string {
  return joinSearchParts([
    client.id,
    client.name,
    client.email,
    client.phone,
    client.notes,
    client.preferredContact,
    client.leadSource,
    client.address,
    client.createdAt,
    tagNamesLine,
  ])
}

export function jobSearchBlob(
  job: Job,
  ctx: { clientName: string; tagNamesLine?: string },
  t: Translate,
): string {
  return joinSearchParts([
    job.id,
    job.clientId,
    ctx.clientName,
    job.description,
    job.status,
    t(`jobs.status.${job.status}`),
    job.createdAt,
    job.dueDate,
    ...moneySearchFragments(job.price),
    ctx.tagNamesLine,
  ])
}

export function pieceSearchBlob(piece: Piece, ctx: { jobLabel: string }, t: Translate): string {
  return joinSearchParts([
    piece.id,
    piece.jobId,
    ctx.jobLabel,
    piece.name,
    piece.status,
    t(`pieces.status.${piece.status}`),
    piece.units === undefined ? undefined : String(piece.units),
    piece.createdAt,
  ])
}

export function crmNoteSearchBlob(
  note: CrmNote,
  ctx: { parentLabel: string },
  t: Translate,
): string {
  return joinSearchParts([
    note.id,
    note.body,
    note.referencedEntityIds,
    note.entityType,
    note.entityId,
    t(`clientDetail.severity.${note.severity}`),
    note.createdAt,
    ctx.parentLabel,
  ])
}

export function transactionSearchBlob(
  transaction: Transaction,
  ctx: { clientLabel: string },
  t: Translate,
): string {
  return joinSearchParts([
    transaction.id,
    transaction.date,
    transaction.type,
    t(`transactions.type.${transaction.type}`),
    ...moneySearchFragments(transaction.amount),
    transaction.category,
    transaction.concept,
    transaction.refType,
    transaction.refId,
    transaction.notes,
    transaction.clientId,
    ctx.clientLabel,
  ])
}

export function inventorySearchBlob(item: InventoryItem, t: Translate): string {
  return joinSearchParts([
    item.id,
    item.type,
    t(`inventory.type.${item.type}`),
    item.name,
    String(item.qtyCurrent),
    String(item.warnYellow),
    String(item.warnOrange),
    String(item.warnRed),
    item.createdAt,
    item.colour,
  ])
}

export function tagSearchBlob(tag: Tag): string {
  return joinSearchParts([tag.id, tag.name, formatTagNameTitleCase(tag.name), tag.createdAt])
}
