/**
 * Canonical workbook schema (v3).
 *
 * The source of truth is `specs/technical/database-model/schema.dbml`;
 * this file mirrors it as typed runtime exports.
 *
 * v3 changes vs v2 are strictly additive and appended at the END of the header
 * rows so the migration engine can map stored columns by position (a stored
 * header must be a prefix of the canonical header):
 *   - jobs      + `due_date`
 *   - inventory + `colour`
 */

export const SPREADSHEET_NAME = 'illo3d-data'
export const METADATA_FILE_NAME = 'illo3d.metadata.json'

/** Lifecycle columns present on every data sheet (not on the immutable audit_log). */
export const LIFECYCLE_COLUMNS = ['archived', 'deleted'] as const

export const SHEET_NAMES = [
  'clients',
  'crm_notes',
  'tags',
  'tag_links',
  'jobs',
  'pieces',
  'piece_items',
  'inventory',
  'lots',
  'transactions',
  'audit_log',
] as const

export type SheetName = (typeof SHEET_NAMES)[number]

export const SHEET_HEADERS: Record<SheetName, readonly string[]> = {
  clients: [
    'id', 'name', 'email', 'phone', 'notes', 'preferred_contact',
    'lead_source', 'address', 'created_at', 'archived', 'deleted',
  ],
  crm_notes: [
    'id', 'entity_type', 'entity_id', 'body', 'referenced_entity_ids',
    'severity', 'created_at', 'archived', 'deleted',
  ],
  tags: ['id', 'name', 'created_at', 'archived', 'deleted'],
  tag_links: [
    'id', 'tag_id', 'entity_type', 'entity_id', 'created_at',
    'archived', 'deleted',
  ],
  jobs: [
    'id', 'client_id', 'description', 'status', 'price', 'board_order',
    'created_at', 'archived', 'deleted', 'due_date',
  ],
  pieces: [
    'id', 'job_id', 'name', 'status', 'price', 'units', 'created_at',
    'archived', 'deleted',
  ],
  piece_items: [
    'id', 'piece_id', 'inventory_id', 'quantity', 'archived', 'deleted',
  ],
  inventory: [
    'id', 'type', 'name', 'qty_current', 'warn_yellow', 'warn_orange',
    'warn_red', 'created_at', 'archived', 'deleted', 'colour',
  ],
  lots: [
    'id', 'inventory_id', 'transaction_id', 'quantity', 'amount',
    'created_at', 'archived', 'deleted',
  ],
  transactions: [
    'id', 'date', 'type', 'amount', 'category', 'concept', 'ref_type',
    'ref_id', 'client_id', 'notes', 'archived', 'deleted',
  ],
  audit_log: [
    'id', 'timestamp', 'actor', 'entity_name', 'entity_id', 'action',
    'before_json', 'after_json', 'fieldsChanged', 'parent_entity_name',
    'parent_entity_id',
  ],
}

/** Sheets that carry domain rows (everything except the immutable audit log). */
export const DATA_SHEET_NAMES = SHEET_NAMES.filter(
  (name) => name !== 'audit_log',
)

export function isSheetName(value: string): value is SheetName {
  return (SHEET_NAMES as readonly string[]).includes(value)
}
