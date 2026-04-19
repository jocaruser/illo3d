export type JobStatus =
  | 'draft'
  | 'in_progress'
  | 'delivered'
  | 'paid'
  | 'cancelled'

export type PieceStatus = 'pending' | 'done' | 'failed'

/** Categories used on expense-type transactions and the purchase form. */
export type PurchaseCategory =
  | 'filament'
  | 'consumable'
  | 'equipment'
  | 'electric'
  | 'maintenance'
  | 'other'

export type TransactionType = 'income' | 'expense'

/** Transaction `ref_type` when linking to another entity; only job income uses `job`. */
export type RefType = 'job'

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
  /** Currency per single manufactured unit (not line total). */
  price?: number
  /** Count of identical units in this line; unset until the user sets it. */
  units?: number
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
  type: InventoryType
  name: string
  qty_current: number
  warn_yellow: number
  warn_orange: number
  warn_red: number
  created_at: string
  archived?: string
  deleted?: string
}

/** Purchase batch / lot linked to one transaction and one inventory material. */
export interface Lot {
  id: string
  inventory_id: string
  transaction_id: string
  quantity: number
  amount: number
  created_at: string
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
  /** Empty when not job-linked (expense transactions use lots instead of ref_id). */
  ref_type: RefType | ''
  ref_id: string
  client_id?: string
  notes?: string
  archived?: string
  deleted?: string
}
