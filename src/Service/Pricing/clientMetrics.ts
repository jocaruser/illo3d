import type { InventoryItem } from '@/Entity/InventoryItem'
import type { Job } from '@/Entity/Job'
import type { Lot } from '@/Entity/Lot'
import type { Piece } from '@/Entity/Piece'
import type { PieceItem } from '@/Entity/PieceItem'
import type { Transaction } from '@/Entity/Transaction'
import { computeAvgUnitCost } from './avgUnitCost'
import { jobPricingState } from './jobPricing'

export interface ClientMetricsInput {
  clientId: string
  jobs: Job[]
  transactions: Transaction[]
  pieces: Piece[]
  pieceItems: PieceItem[]
  inventory: InventoryItem[]
  lots: Lot[]
}

export interface ClientMetrics {
  /** Σ active income transaction amounts for the client. */
  paidLedger: number
  /** Σ complete pricing totals of the client's non-paid / non-cancelled jobs. */
  outstandingJobs: number
  jobCount: number
  /** Mean of complete pricing totals excluding cancelled jobs; null when none. */
  averageJobPrice: number | null
  /** Σ consumed-piece material (line qty × units) at average lot unit cost. */
  materialsEstimate: number
}

function countingPiecesForJob(jobId: string, pieces: Piece[]): Piece[] {
  return pieces.filter((piece) => piece.jobId === jobId && !piece.isDeleted())
}

export function computeClientMetrics(input: ClientMetricsInput): ClientMetrics {
  const { clientId, transactions, pieces, pieceItems, inventory, lots } = input
  const clientJobs = input.jobs.filter((job) => job.isActive() && job.clientId === clientId)

  let paidLedger = 0
  for (const transaction of transactions) {
    if (!transaction.isActive() || !transaction.isIncome()) continue
    if (transaction.clientId !== clientId) continue
    paidLedger += transaction.amount ?? 0
  }

  let outstandingJobs = 0
  const totalsForAverage: number[] = []
  for (const job of clientJobs) {
    const state = jobPricingState(countingPiecesForJob(job.id, pieces))
    if (!state.complete) continue
    if (!job.isCompleted()) outstandingJobs += state.total
    if (job.status !== 'cancelled') totalsForAverage.push(state.total)
  }
  const averageJobPrice =
    totalsForAverage.length === 0
      ? null
      : totalsForAverage.reduce((sum, total) => sum + total, 0) / totalsForAverage.length

  const jobIds = new Set(clientJobs.map((job) => job.id))
  const inventoryById = new Map(inventory.map((item) => [item.id, item]))
  const consumedPieces = pieces.filter(
    (piece) => jobIds.has(piece.jobId) && !piece.isDeleted() && piece.isConsuming(),
  )
  const pieceById = new Map(consumedPieces.map((piece) => [piece.id, piece]))

  let materialsEstimate = 0
  for (const line of pieceItems) {
    const piece = pieceById.get(line.pieceId)
    if (!piece || !line.isActive() || line.quantity === undefined) continue
    const item = inventoryById.get(line.inventoryId)
    if (!item) continue
    const unitCost = computeAvgUnitCost(lots.filter((lot) => lot.inventoryId === item.id))
    if (unitCost === null) continue
    const units = piece.hasValidUnits() ? (piece.units as number) : 1
    materialsEstimate += line.quantity * units * unitCost
  }

  return {
    paidLedger,
    outstandingJobs,
    jobCount: clientJobs.length,
    averageJobPrice,
    materialsEstimate,
  }
}
