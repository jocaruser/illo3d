import { describe, it, expect } from 'vitest'
import { computeClientDetailMetrics } from './clientMetrics'
import type { Inventory, Job, Lot, Piece, PieceItem, Transaction } from '@/types/money'

function job(partial: Partial<Job> & Pick<Job, 'id' | 'client_id'>): Job {
  return {
    description: 'd',
    status: 'draft',
    created_at: '2025-01-01',
    ...partial,
  }
}

describe('computeClientDetailMetrics', () => {
  it('sums income transactions for client only', () => {
    const txs: Transaction[] = [
      {
        id: 'T1',
        date: '2025-01-01',
        type: 'income',
        amount: 50,
        category: 'job',
        concept: 'a',
        ref_type: 'job',
        ref_id: 'J1',
        client_id: 'CL1',
      },
      {
        id: 'T2',
        date: '2025-01-02',
        type: 'income',
        amount: 30,
        category: 'job',
        concept: 'b',
        ref_type: 'job',
        ref_id: 'J2',
        client_id: 'CL2',
      },
    ]
    const m = computeClientDetailMetrics({
      clientId: 'CL1',
      jobs: [],
      transactions: txs,
      pieces: [],
      pieceItems: [],
      inventoryRows: [],
      lots: [],
    })
    expect(m.paidLedger).toBe(50)
  })

  it('outstanding sums non-paid non-cancelled job prices', () => {
    const jobs: Job[] = [
      job({ id: 'J1', client_id: 'CL1', status: 'draft' }),
      job({ id: 'J2', client_id: 'CL1', status: 'paid', price: 99 }),
      job({ id: 'J3', client_id: 'CL1', status: 'cancelled', price: 5 }),
    ]
    const pieces = [
      {
        id: 'P1',
        job_id: 'J1',
        name: 'a',
        status: 'pending' as const,
        price: 10,
        units: 1,
        created_at: '2025-01-01',
      },
    ]
    const m = computeClientDetailMetrics({
      clientId: 'CL1',
      jobs,
      transactions: [],
      pieces,
      pieceItems: [],
      inventoryRows: [],
      lots: [],
    })
    expect(m.outstandingJobs).toBe(10)
    expect(m.jobCount).toBe(3)
  })

  it('average job price excludes cancelled and missing price', () => {
    const jobs: Job[] = [
      job({ id: 'J1', client_id: 'CL1', status: 'delivered' }),
      job({ id: 'J2', client_id: 'CL1', status: 'cancelled', price: 100 }),
      job({ id: 'J3', client_id: 'CL1', status: 'draft' }),
    ]
    const pieces = [
      {
        id: 'P1',
        job_id: 'J1',
        name: 'a',
        status: 'pending' as const,
        price: 20,
        units: 1,
        created_at: '2025-01-01',
      },
    ]
    const m = computeClientDetailMetrics({
      clientId: 'CL1',
      jobs,
      transactions: [],
      pieces,
      pieceItems: [],
      inventoryRows: [],
      lots: [],
    })
    expect(m.averageJobPrice).toBe(20)
  })

  it('materials sums done piece consumption with unit cost', () => {
    const jobs: Job[] = [
      job({ id: 'J1', client_id: 'CL1', status: 'paid', price: 0 }),
    ]
    const pieces: Piece[] = [
      {
        id: 'P1',
        job_id: 'J1',
        name: 'x',
        status: 'done',
        units: 1,
        created_at: '2025-01-01',
      },
    ]
    const pieceItems: PieceItem[] = [
      { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 10 },
    ]
    const inventoryRows: Inventory[] = [
      {
        id: 'INV1',
        type: 'filament',
        name: 'PLA',
        qty_current: 990,
        warn_yellow: 0,
        warn_orange: 0,
        warn_red: 0,
        created_at: '2025-01-01',
      },
    ]
    const lots: Lot[] = [
      {
        id: 'L1',
        inventory_id: 'INV1',
        transaction_id: 'T1',
        quantity: 1000,
        amount: 20,
        created_at: '2025-01-01',
      },
    ]
    const m = computeClientDetailMetrics({
      clientId: 'CL1',
      jobs,
      transactions: [],
      pieces,
      pieceItems,
      inventoryRows,
      lots,
    })
    expect(m.materialsEstimate).toBeCloseTo(10 * (20 / 1000), 6)
  })
})
