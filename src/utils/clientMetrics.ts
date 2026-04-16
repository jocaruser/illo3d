import type {
  Expense,
  Inventory,
  Job,
  Piece,
  PieceItem,
  Transaction,
} from '@/types/money'
import { jobPricingState } from '@/utils/jobPiecePricing'

export interface ClientDetailMetricsInput {
  clientId: string
  jobs: Job[]
  transactions: Transaction[]
  pieces: Piece[]
  pieceItems: PieceItem[]
  inventoryRows: Inventory[]
  expenses: Expense[]
}

export interface ClientDetailMetrics {
  paidLedger: number
  outstandingJobs: number
  jobCount: number
  averageJobPrice: number | null
  materialsEstimate: number
}

function unitCostForInventory(
  inv: Inventory | undefined,
  expById: Map<string, Expense>
): number | null {
  if (!inv) return null
  if (!Number.isFinite(inv.qty_initial) || inv.qty_initial <= 0) return null
  const expense = expById.get(inv.expense_id)
  if (!expense || !Number.isFinite(expense.amount)) return null
  return expense.amount / inv.qty_initial
}

export function computeClientDetailMetrics(
  input: ClientDetailMetricsInput
): ClientDetailMetrics {
  const { clientId, jobs, transactions, pieces, pieceItems, inventoryRows, expenses } =
    input

  const clientJobs = jobs.filter((j) => j.client_id === clientId)

  let paidLedger = 0
  for (const tx of transactions) {
    if (tx.type === 'income' && tx.client_id === clientId) {
      const a =
        typeof tx.amount === 'number' ? tx.amount : Number(tx.amount)
      if (Number.isFinite(a)) paidLedger += a
    }
  }

  let outstandingJobs = 0
  for (const j of clientJobs) {
    if (j.status === 'paid' || j.status === 'cancelled') continue
    const st = jobPricingState(j.id, pieces)
    if (st.kind === 'complete') outstandingJobs += st.total
  }

  const jobCount = clientJobs.length

  const totalsForAverage: number[] = []
  for (const j of clientJobs) {
    if (j.status === 'cancelled') continue
    const st = jobPricingState(j.id, pieces)
    if (st.kind === 'complete') totalsForAverage.push(st.total)
  }
  const averageJobPrice =
    totalsForAverage.length === 0
      ? null
      : totalsForAverage.reduce((s, n) => s + n, 0) / totalsForAverage.length

  const jobIds = new Set(clientJobs.map((j) => j.id))
  const invById = new Map(inventoryRows.map((i) => [i.id, i]))
  const expById = new Map(expenses.map((e) => [e.id, e]))

  let materialsEstimate = 0
  const relevantPieces = pieces.filter(
    (p) =>
      jobIds.has(p.job_id) &&
      (p.status === 'done' || p.status === 'failed')
  )
  const pieceIds = new Set(relevantPieces.map((p) => p.id))
  for (const line of pieceItems) {
    if (!pieceIds.has(line.piece_id)) continue
    const inv = invById.get(line.inventory_id)
    const uc = unitCostForInventory(inv, expById)
    if (uc == null) continue
    const qty =
      typeof line.quantity === 'number' ? line.quantity : Number(line.quantity)
    if (!Number.isFinite(qty)) continue
    materialsEstimate += qty * uc
  }

  return {
    paidLedger,
    outstandingJobs,
    jobCount,
    averageJobPrice,
    materialsEstimate,
  }
}
