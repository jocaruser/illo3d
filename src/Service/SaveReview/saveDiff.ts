import { SHEET_HEADERS, type SheetName } from '@/Config/schema'
import { AuditEntry, type AuditEntityName } from '@/Entity/AuditEntry'
import type { SheetRecord } from '@/Entity/SheetEntity'
import { matrixToRecords } from '@/Repository/Matrix'
import type { WorkbookTabs } from '@/Store/workbookStore'

/**
 * The save preview's diff is not computed by comparing matrices: every domain
 * mutation already logged an audit entry with full before/after snapshots, so
 * the unsaved tail of `audit_log` *is* the diff. These helpers coalesce that
 * tail into one net change per row, ready to render git-style.
 */

/** Sheet that stores each audited entity. */
export const ENTITY_SHEET: Record<AuditEntityName, SheetName> = {
  client: 'clients',
  crm_note: 'crm_notes',
  tag: 'tags',
  tag_link: 'tag_links',
  job: 'jobs',
  piece: 'pieces',
  piece_item: 'piece_items',
  inventory: 'inventory',
  lot: 'lots',
  transaction: 'transactions',
}

export type RowDiffAction = 'created' | 'modified' | 'deleted'

export interface FieldDiff {
  column: string
  before: string
  after: string
  changed: boolean
}

export interface RowDiff {
  entityName: AuditEntityName
  entityId: string
  sheet: SheetName
  action: RowDiffAction
  /** One entry per canonical column of the sheet, in header order. */
  fields: FieldDiff[]
  changedCount: number
  /** Net snapshots, kept for entity-name resolution in the UI. */
  beforeJson: string
  afterJson: string
}

export interface SaveDiff {
  /** Net row diffs per sheet; sheets with no net change are absent. */
  rowsBySheet: Partial<Record<SheetName, RowDiff[]>>
  /** Unsaved audit entries — the audit_log sheet's own pending appends. */
  newAuditEntries: AuditEntry[]
}

/** The audit rows appended since the last hydrate/save, oldest first. */
export function unsavedAuditEntries(tabs: WorkbookTabs, savedAuditRows: number): AuditEntry[] {
  return matrixToRecords('audit_log', tabs.audit_log)
    .slice(savedAuditRows)
    .map((record) => AuditEntry.fromRecord(record))
}

/**
 * Coalesce the unsaved audit tail into one net diff per row: the first
 * entry's `before` against the last entry's `after`. A row created and then
 * hard-deleted before saving nets to nothing and is dropped, as is a row
 * whose edits were all reverted (its net diff changes no field).
 */
export function computeSaveDiff(entries: AuditEntry[]): SaveDiff {
  const byRow = new Map<string, { first: AuditEntry; last: AuditEntry }>()
  for (const entry of entries) {
    // Rows we cannot place (no entity, or an entity we do not know a sheet
    // for) still save fine — they are just not previewable as a diff.
    if (entry.entityName === '' || entry.entityId === '') continue
    if (!(entry.entityName in ENTITY_SHEET)) continue
    const key = `${entry.entityName}:${entry.entityId}`
    const existing = byRow.get(key)
    if (existing === undefined) byRow.set(key, { first: entry, last: entry })
    else existing.last = entry
  }

  const rowsBySheet: Partial<Record<SheetName, RowDiff[]>> = {}
  for (const { first, last } of byRow.values()) {
    const diff = netRowDiff(first, last)
    if (diff === null) continue
    ;(rowsBySheet[diff.sheet] ??= []).push(diff)
  }
  return { rowsBySheet, newAuditEntries: entries }
}

function netRowDiff(first: AuditEntry, last: AuditEntry): RowDiff | null {
  const entityName = first.entityName as AuditEntityName
  const sheet = ENTITY_SHEET[entityName]
  const created = first.beforeJson === ''
  const deleted = last.afterJson === ''
  // Created and hard-deleted before ever being saved: the row never existed.
  if (created && deleted) return null

  const before = parseSnapshot(first.beforeJson)
  const after = parseSnapshot(last.afterJson)
  const fields = SHEET_HEADERS[sheet].map((column) => {
    const beforeValue = String(before[column] ?? '')
    const afterValue = String(after[column] ?? '')
    return {
      column,
      before: beforeValue,
      after: afterValue,
      changed: beforeValue !== afterValue,
    }
  })
  const changedCount = fields.filter((field) => field.changed).length
  // Every edit was reverted in the preview: nothing will change on disk.
  if (!created && !deleted && changedCount === 0) return null

  return {
    entityName,
    entityId: first.entityId,
    sheet,
    action: created ? 'created' : deleted ? 'deleted' : 'modified',
    fields,
    changedCount,
    beforeJson: first.beforeJson,
    afterJson: last.afterJson,
  }
}

/** Audit snapshots are JSON records of strings; anything unreadable reads as empty. */
function parseSnapshot(json: string): SheetRecord {
  if (json.trim() === '') return {}
  try {
    const parsed: unknown = JSON.parse(json)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const record: SheetRecord = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      record[key] = typeof value === 'string' ? value : String(value)
    }
    return record
  } catch {
    return {}
  }
}
