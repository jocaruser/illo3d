import { SHEET_HEADERS, type SheetName } from '@/services/sheets/config'
import { parseClientNoteSeverity } from '@/services/clientNote/severity'
import { parseJobRow } from '@/services/sheets/jobs'
import { parsePieceRow } from '@/services/sheets/pieces'
import type {
  Client,
  CrmNote,
  CrmNoteEntityType,
  Inventory,
  Job,
  Lot,
  Piece,
  PieceItem,
  Tag,
  TagEntityType,
  TagLink,
  Transaction,
} from '@/types/money'

export function matrixToObjects<T extends object>(
  sheetName: SheetName,
  matrix: string[][] | undefined
): T[] {
  if (!matrix || matrix.length < 2) return []
  const headers = SHEET_HEADERS[sheetName]
  const dataRows = matrix.slice(1).filter((row) => row.some((c) => c !== ''))
  return dataRows.map((row) => {
    const obj = {} as T
    headers.forEach((h, i) => {
      const v = row[i]
      if (v !== undefined && v !== null && v !== '') {
        ;(obj as Record<string, unknown>)[h] = v
      }
    })
    return obj
  })
}

export function matrixToClients(matrix: string[][] | undefined): Client[] {
  const raw = matrixToObjects<Client>('clients', matrix)
  return raw.filter((c) => c.id != null && c.name != null)
}

export function matrixToJobs(matrix: string[][] | undefined): Job[] {
  const rows = matrixToObjects<Job>('jobs', matrix)
  return rows
    .filter((r) => r.id)
    .map(parseJobRow)
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}

export function matrixToPieces(matrix: string[][] | undefined): Piece[] {
  const rows = matrixToObjects<Piece>('pieces', matrix)
  return rows
    .filter((r) => r.id)
    .map((r) => parsePieceRow(r))
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}

function parseCrmNoteEntityType(raw: string | undefined): CrmNoteEntityType | null {
  const t = raw?.trim()
  if (t === 'client' || t === 'job') return t
  return null
}

export function matrixToCrmNotes(matrix: string[][] | undefined): CrmNote[] {
  const raw = matrixToObjects<Record<string, string>>('crm_notes', matrix)
  const byId = new Map<string, CrmNote>()
  for (const r of raw) {
    const entityType = parseCrmNoteEntityType(r.entity_type)
    if (!entityType || !r.id?.trim() || !r.entity_id?.trim()) continue
    const severity = parseClientNoteSeverity(r.severity)
    if (!severity) continue
    const note: CrmNote = {
      id: r.id.trim(),
      entity_type: entityType,
      entity_id: r.entity_id.trim(),
      body: r.body?.trim() ?? '',
      referenced_entity_ids: r.referenced_entity_ids?.trim() ?? '',
      severity,
      created_at: r.created_at?.trim() ?? '',
    }
    if (r.archived) note.archived = r.archived
    if (r.deleted) note.deleted = r.deleted
    const prev = byId.get(note.id)
    if (!prev || note.created_at >= prev.created_at) {
      byId.set(note.id, note)
    }
  }
  return Array.from(byId.values()).sort((a, b) =>
    b.created_at > a.created_at ? 1 : -1
  )
}

export function matrixToTransactions(
  matrix: string[][] | undefined
): Transaction[] {
  const raw = matrixToObjects<Transaction>('transactions', matrix)
  return raw
    .filter((r) => r.id && r.date)
    .map((r) => {
      const legacyRef = String(r.ref_type ?? '').trim()
      const refIsJob = legacyRef === 'job'
      return {
        ...r,
        ref_type: refIsJob ? ('job' as const) : ('' as const),
        ref_id: refIsJob ? String(r.ref_id ?? '').trim() : '',
        amount:
          typeof r.amount === 'string' ? parseFloat(r.amount) : Number(r.amount),
      }
    })
    .sort((a, b) => (b.date > a.date ? 1 : -1))
}

export function matrixToLots(matrix: string[][] | undefined): Lot[] {
  const raw = matrixToObjects<Lot>('lots', matrix)
  return raw
    .filter((r) => r.id && r.inventory_id && r.transaction_id)
    .map((r) => ({
      ...r,
      quantity:
        typeof r.quantity === 'string'
          ? parseFloat(r.quantity)
          : Number(r.quantity),
      amount:
        typeof r.amount === 'string' ? parseFloat(r.amount) : Number(r.amount),
    }))
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}

function parseQty(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return Number(value)
}

function parseWarnThreshold(value: unknown): number {
  if (value === '' || value === undefined || value === null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function matrixToInventory(matrix: string[][] | undefined): Inventory[] {
  const raw = matrixToObjects<Inventory>('inventory', matrix)
  return raw
    .filter((r) => r.id && r.created_at)
    .map((r) => ({
      ...r,
      qty_current: parseQty(r.qty_current),
      warn_yellow: parseWarnThreshold(r.warn_yellow),
      warn_orange: parseWarnThreshold(r.warn_orange),
      warn_red: parseWarnThreshold(r.warn_red),
    }))
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
}

export function matrixToTags(matrix: string[][] | undefined): Tag[] {
  const raw = matrixToObjects<Tag>('tags', matrix)
  return raw.filter((r) => r.id?.trim() && r.name?.trim())
}

function parseTagLinkEntityType(raw: string | undefined): TagEntityType | null {
  const s = raw?.trim()
  if (s === 'client' || s === 'job') return s
  return null
}

function parsePieceItemQty(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value)
  return Number(value)
}

export function matrixToPieceItems(matrix: string[][] | undefined): PieceItem[] {
  const raw = matrixToObjects<PieceItem>('piece_items', matrix)
  return raw
    .filter((r) => r.id && r.piece_id && r.inventory_id)
    .map((r) => ({
      ...r,
      quantity: parsePieceItemQty(r.quantity),
    }))
    .sort((a, b) => {
      const byPiece = a.piece_id.localeCompare(b.piece_id)
      if (byPiece !== 0) return byPiece
      return a.id.localeCompare(b.id)
    })
}

export function matrixToTagLinks(matrix: string[][] | undefined): TagLink[] {
  const raw = matrixToObjects<Record<string, string>>('tag_links', matrix)
  const out: TagLink[] = []
  for (const r of raw) {
    if (!r.id?.trim() || !r.tag_id?.trim()) continue
    const entity_type = parseTagLinkEntityType(r.entity_type)
    if (!entity_type || !r.entity_id?.trim()) continue
    const link: TagLink = {
      id: r.id.trim(),
      tag_id: r.tag_id.trim(),
      entity_type,
      entity_id: r.entity_id.trim(),
      created_at: r.created_at?.trim() ?? '',
    }
    if (r.archived) link.archived = r.archived
    if (r.deleted) link.deleted = r.deleted
    out.push(link)
  }
  return out
}
