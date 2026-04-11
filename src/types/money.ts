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

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  created_at: string
}

export interface Job {
  id: string
  client_id: string
  description: string
  status: JobStatus
  price?: number
  created_at: string
}

export interface Piece {
  id: string
  job_id: string
  name: string
  status: PieceStatus
  created_at: string
}

export interface PieceItem {
  id: string
  piece_id: string
  inventory_id: string
  quantity: number
}

export interface Inventory {
  id: string
  expense_id: string
  type: InventoryType
  name: string
  qty_initial: number
  qty_current: number
  created_at: string
}

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  amount: number
  notes?: string
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
}
