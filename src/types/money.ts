export type JobStatus =
  | 'draft'
  | 'in_progress'
  | 'delivered'
  | 'paid'
  | 'cancelled'

export type PieceStatus = 'pending' | 'done' | 'failed'

export type ExpenseCategory =
  | 'filament'
  | 'consumable'
  | 'electric'
  | 'investment'
  | 'maintenance'
  | 'other'

export type TransactionType = 'income' | 'expense'

export type RefType = 'job' | 'expense'

export type InventoryType = 'filament' | 'consumable' | 'equipment'

export type ClientNoteSeverity =
  | 'info'
  | 'danger'
  | 'warning'
  | 'success'
  | 'primary'
  | 'secondary'

export interface ClientNote {
  id: string
  client_id: string
  body: string
  referenced_entity_ids: string
  severity: ClientNoteSeverity
  created_at: string
}

export interface JobNote {
  id: string
  job_id: string
  body: string
  referenced_entity_ids: string
  severity: ClientNoteSeverity
  created_at: string
}

/** Values stored in `crm_notes.entity_type`; extend when new entities support CRM notes. */
export type CrmNoteEntityType = 'client' | 'job'

export interface CrmNote {
  id: string
  entity_type: CrmNoteEntityType
  entity_id: string
  body: string
  referenced_entity_ids: string
  severity: ClientNoteSeverity
  created_at: string
  archived?: string
  deleted?: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  preferred_contact?: string
  lead_source?: string
  address?: string
  created_at: string
  archived?: string
  deleted?: string
}

export type TagEntityType = 'client' | 'job'

export interface Tag {
  id: string
  name: string
  created_at: string
  archived?: string
  deleted?: string
}

export interface TagLink {
  id: string
  tag_id: string
  entity_type: TagEntityType
  entity_id: string
  created_at: string
  archived?: string
  deleted?: string
}

export interface Job {
  id: string
  client_id: string
  description: string
  status: JobStatus
  price?: number
  /** Kanban column ordering (optional in sheet; lower sorts first). */
  board_order?: number
  created_at: string
  archived?: string
  deleted?: string
}

export interface Piece {
  id: string
  job_id: string
  name: string
  status: PieceStatus
  created_at: string
  archived?: string
  deleted?: string
}

export interface PieceItem {
  id: string
  piece_id: string
  inventory_id: string
  quantity: number
  archived?: string
  deleted?: string
}

export interface Inventory {
  id: string
  expense_id: string
  type: InventoryType
  name: string
  qty_initial: number
  qty_current: number
  created_at: string
  archived?: string
  deleted?: string
}

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  amount: number
  notes?: string
  archived?: string
  deleted?: string
}

export interface Transaction {
  id: string
  date: string
  type: TransactionType
  amount: number
  category: string
  concept: string
  ref_type: RefType
  ref_id: string
  client_id?: string
  notes?: string
  archived?: string
  deleted?: string
}
