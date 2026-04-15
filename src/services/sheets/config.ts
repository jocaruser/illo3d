export const SPREADSHEET_NAME = 'illo3d-data'

export const SHEET_NAMES = [
  'clients',
  'crm_notes',
  'tags',
  'tag_links',
  'jobs',
  'pieces',
  'piece_items',
  'inventory',
  'expenses',
  'transactions',
] as const

export type SheetName = (typeof SHEET_NAMES)[number]

export const SHEET_HEADERS: Record<SheetName, readonly string[]> = {
  clients: [
    'id',
    'name',
    'email',
    'phone',
    'notes',
    'preferred_contact',
    'lead_source',
    'address',
    'created_at',
  ],
  crm_notes: [
    'id',
    'entity_type',
    'entity_id',
    'body',
    'referenced_entity_ids',
    'severity',
    'created_at',
  ],
  tags: ['id', 'name', 'created_at'],
  tag_links: ['id', 'tag_id', 'entity_type', 'entity_id', 'created_at'],
  jobs: ['id', 'client_id', 'description', 'status', 'price', 'created_at'],
  pieces: ['id', 'job_id', 'name', 'status', 'created_at'],
  piece_items: ['id', 'piece_id', 'inventory_id', 'quantity'],
  inventory: ['id', 'expense_id', 'type', 'name', 'qty_initial', 'qty_current', 'created_at'],
  expenses: ['id', 'date', 'category', 'amount', 'notes'],
  transactions: ['id', 'date', 'type', 'amount', 'category', 'concept', 'ref_type', 'ref_id', 'client_id', 'notes'],
}
