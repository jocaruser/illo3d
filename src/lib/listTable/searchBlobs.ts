import type {
  Client,
  CrmNote,
  Inventory,
  Job,
  Piece,
  Tag,
  Transaction,
} from '@/types/money'
import { joinSearchParts, moneySearchFragments } from '@/lib/listTable/moneySearchFragments'
import { formatInventoryCreatedDate } from '@/services/sheets/inventory'

export function buildClientSearchBlob(
  client: Client,
  tagNamesSearchLine?: string
): string {
  return joinSearchParts([
    client.id,
    client.name,
    client.email,
    client.phone,
    client.notes,
    client.preferred_contact,
    client.lead_source,
    client.address,
    client.created_at,
    tagNamesSearchLine,
  ])
}

export function buildJobSearchBlob(
  job: Job,
  ctx: {
    clientName: string
    statusLabel: string
    /** Space-joined tag names for fuzzy search (same pool as clients). */
    tagNamesSearchLine?: string
  }
): string {
  return joinSearchParts([
    job.id,
    job.client_id,
    ctx.clientName,
    job.description,
    job.status,
    ctx.statusLabel,
    job.created_at,
    ...moneySearchFragments(job.price),
    ctx.tagNamesSearchLine,
  ])
}

export function buildTransactionSearchBlob(
  tx: Transaction,
  ctx: { typeLabel: string; clientLabel: string }
): string {
  return joinSearchParts([
    tx.id,
    tx.date,
    tx.type,
    ctx.typeLabel,
    ...moneySearchFragments(tx.amount),
    tx.category,
    tx.concept,
    tx.ref_type,
    tx.ref_id,
    tx.notes,
    tx.client_id,
    ctx.clientLabel,
  ])
}

export function buildInventorySearchBlob(
  item: Inventory,
  ctx: { typeLabel: string }
): string {
  return joinSearchParts([
    item.id,
    item.type,
    ctx.typeLabel,
    item.name,
    String(item.qty_current),
    String(item.warn_yellow),
    String(item.warn_orange),
    String(item.warn_red),
    item.created_at,
    formatInventoryCreatedDate(item.created_at),
  ])
}

export function buildPieceSearchBlob(
  piece: Piece,
  ctx: { statusLabel: string; jobLabel: string }
): string {
  return joinSearchParts([
    piece.id,
    piece.job_id,
    ctx.jobLabel,
    piece.name,
    piece.status,
    ctx.statusLabel,
    piece.units != null ? String(piece.units) : '',
    piece.created_at,
  ])
}

export function buildCrmNoteSearchBlob(
  note: CrmNote,
  ctx: { severityLabel: string; parentLabel: string }
): string {
  return joinSearchParts([
    note.id,
    note.body,
    note.referenced_entity_ids,
    note.entity_type,
    note.entity_id,
    ctx.severityLabel,
    note.created_at,
    ctx.parentLabel,
  ])
}

export function buildTagSearchBlob(tag: Tag): string {
  return joinSearchParts([tag.id, tag.name, tag.created_at])
}
