import { describe, expect, it } from 'vitest'
import { InventoryItem } from '@/Entity/InventoryItem'
import { Job } from '@/Entity/Job'
import { Lot } from '@/Entity/Lot'
import { Piece } from '@/Entity/Piece'
import { PieceItem } from '@/Entity/PieceItem'
import { Transaction } from '@/Entity/Transaction'
import { computeClientMetrics, type ClientMetricsInput } from '@/Service/Pricing/clientMetrics'

function baseInput(overrides?: Partial<ClientMetricsInput>): ClientMetricsInput {
  return {
    clientId: 'CL1',
    jobs: [],
    transactions: [],
    pieces: [],
    pieceItems: [],
    inventory: [],
    lots: [],
    ...overrides,
  }
}

describe('computeClientMetrics', () => {
  it('returns zeros and a null average for an empty client', () => {
    expect(computeClientMetrics(baseInput())).toEqual({
      paidLedger: 0,
      outstandingJobs: 0,
      jobCount: 0,
      averageJobPrice: null,
      materialsEstimate: 0,
    })
  })

  it('paidLedger sums active income of the client only', () => {
    const metrics = computeClientMetrics(
      baseInput({
        transactions: [
          Transaction.fromRecord({ id: 'T1', type: 'income', client_id: 'CL1', amount: '10' }),
          Transaction.fromRecord({ id: 'T2', type: 'income', client_id: 'CL1', amount: '' }),
          Transaction.fromRecord({ id: 'T3', type: 'income', client_id: 'CL2', amount: '99' }),
          Transaction.fromRecord({ id: 'T4', type: 'expense', client_id: 'CL1', amount: '-5' }),
          Transaction.fromRecord({
            id: 'T5',
            type: 'income',
            client_id: 'CL1',
            amount: '7',
            deleted: 'true',
          }),
        ],
      }),
    )
    expect(metrics.paidLedger).toBe(10)
  })

  it('outstanding sums complete totals of non-terminal jobs; average excludes cancelled', () => {
    const metrics = computeClientMetrics(
      baseInput({
        jobs: [
          Job.fromRecord({ id: 'J1', client_id: 'CL1', status: 'draft' }),
          Job.fromRecord({ id: 'J2', client_id: 'CL1', status: 'paid' }),
          Job.fromRecord({ id: 'J3', client_id: 'CL1', status: 'cancelled' }),
          Job.fromRecord({ id: 'J4', client_id: 'CL1', status: 'in_progress' }),
          Job.fromRecord({ id: 'J5', client_id: 'CL2', status: 'draft' }),
          Job.fromRecord({ id: 'J6', client_id: 'CL1', status: 'draft', archived: 'true' }),
        ],
        pieces: [
          Piece.fromRecord({ id: 'P1', job_id: 'J1', price: '10', units: '1' }),
          Piece.fromRecord({ id: 'P2', job_id: 'J2', price: '20', units: '1' }),
          Piece.fromRecord({ id: 'P3', job_id: 'J3', price: '30', units: '1' }),
          // J4 incomplete: counting piece without price.
          Piece.fromRecord({ id: 'P4', job_id: 'J4', units: '1' }),
          // Deleted piece does not block completeness elsewhere.
          Piece.fromRecord({ id: 'P5', job_id: 'J1', deleted: 'true' }),
        ],
      }),
    )
    expect(metrics.jobCount).toBe(4)
    expect(metrics.outstandingJobs).toBe(10)
    expect(metrics.averageJobPrice).toBe(15)
  })

  it('materialsEstimate prices consumed pieces at average lot cost', () => {
    const metrics = computeClientMetrics(
      baseInput({
        jobs: [Job.fromRecord({ id: 'J1', client_id: 'CL1', status: 'draft' })],
        pieces: [
          Piece.fromRecord({ id: 'P1', job_id: 'J1', status: 'done', units: '2' }),
          Piece.fromRecord({ id: 'P2', job_id: 'J1', status: 'failed' }), // units unset → 1
          Piece.fromRecord({ id: 'P3', job_id: 'J1', status: 'pending', units: '5' }),
          Piece.fromRecord({ id: 'P4', job_id: 'J1', status: 'done', units: '1', deleted: 'true' }),
        ],
        pieceItems: [
          PieceItem.fromRecord({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '100' }),
          PieceItem.fromRecord({ id: 'PI2', piece_id: 'P2', inventory_id: 'INV1', quantity: '50' }),
          PieceItem.fromRecord({ id: 'PI3', piece_id: 'P3', inventory_id: 'INV1', quantity: '99' }),
          PieceItem.fromRecord({ id: 'PI4', piece_id: 'P4', inventory_id: 'INV1', quantity: '99' }),
          PieceItem.fromRecord({
            id: 'PI5',
            piece_id: 'P1',
            inventory_id: 'INV1',
            quantity: '9',
            deleted: 'true',
          }),
          PieceItem.fromRecord({ id: 'PI6', piece_id: 'P1', inventory_id: 'INV1', quantity: '' }),
          PieceItem.fromRecord({ id: 'PI7', piece_id: 'P1', inventory_id: 'INVX', quantity: '1' }),
        ],
        inventory: [InventoryItem.fromRecord({ id: 'INV1', name: 'PLA' })],
        lots: [Lot.fromRecord({ id: 'L1', inventory_id: 'INV1', quantity: '1000', amount: '20' })],
      }),
    )
    // P1: 100 × 2 × 0.02 = 4; P2: 50 × 1 × 0.02 = 1
    expect(metrics.materialsEstimate).toBe(5)
  })

  it('skips consumed lines when the average lot cost is unknown', () => {
    const metrics = computeClientMetrics(
      baseInput({
        jobs: [Job.fromRecord({ id: 'J1', client_id: 'CL1', status: 'draft' })],
        pieces: [Piece.fromRecord({ id: 'P1', job_id: 'J1', status: 'done', units: '1' })],
        pieceItems: [
          PieceItem.fromRecord({ id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '10' }),
        ],
        inventory: [InventoryItem.fromRecord({ id: 'INV1', name: 'PLA' })],
        lots: [],
      }),
    )
    expect(metrics.materialsEstimate).toBe(0)
  })
})
