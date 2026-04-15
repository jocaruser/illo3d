export const SPREADSHEET_NAME = 'illo3d-data'

export const SHEET_NAMES = [
  'clients',
  'client_notes',
  'jobs',
  'pieces',
  'piece_items',
  'inventory',
  'expenses',
  'transactions',
] as const

export type SheetName = (typeof SHEET_NAMES)[number]

export const SHEET_HEADERS: Record<SheetName, readonly string[]> = {
  clients: ['id', 'name', 'email', 'phone', 'notes', 'created_at'],
  client_notes: ['id', 'client_id', 'body', 'severity', 'created_at'],
  jobs: ['id', 'client_id', 'description', 'status', 'price', 'created_at'],
  pieces: ['id', 'job_id', 'name', 'status', 'created_at'],
  piece_items: ['id', 'piece_id', 'inventory_id', 'quantity'],
  inventory: ['id', 'expense_id', 'type', 'name', 'qty_initial', 'qty_current', 'created_at'],
  expenses: ['id', 'date', 'category', 'amount', 'notes'],
  transactions: ['id', 'date', 'type', 'amount', 'category', 'concept', 'ref_type', 'ref_id', 'client_id', 'notes'],
}
