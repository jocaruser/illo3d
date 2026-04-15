import { describe, it, expect } from 'vitest'
import { computeClientDetailMetrics } from './clientMetrics'
import type {
  Expense,
  Inventory,
  Job,
  Piece,
  PieceItem,
  Transaction,
} from '@/types/money'

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
      expenses: [],
    })
    expect(m.paidLedger).toBe(50)
  })

  it('outstanding sums non-paid non-cancelled job prices', () => {
    const jobs: Job[] = [
      job({ id: 'J1', client_id: 'CL1', status: 'draft', price: 10 }),
      job({ id: 'J2', client_id: 'CL1', status: 'paid', price: 99 }),
      job({ id: 'J3', client_id: 'CL1', status: 'cancelled', price: 5 }),
    ]
    const m = computeClientDetailMetrics({
      clientId: 'CL1',
      jobs,
      transactions: [],
      pieces: [],
      pieceItems: [],
      inventoryRows: [],
      expenses: [],
    })
    expect(m.outstandingJobs).toBe(10)
    expect(m.jobCount).toBe(3)
  })

  it('average job price excludes cancelled and missing price', () => {
    const jobs: Job[] = [
      job({ id: 'J1', client_id: 'CL1', status: 'delivered', price: 20 }),
      job({ id: 'J2', client_id: 'CL1', status: 'cancelled', price: 100 }),
      job({ id: 'J3', client_id: 'CL1', status: 'draft' }),
    ]
    const m = computeClientDetailMetrics({
      clientId: 'CL1',
      jobs,
      transactions: [],
      pieces: [],
      pieceItems: [],
      inventoryRows: [],
      expenses: [],
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
        created_at: '2025-01-01',
      },
    ]
    const pieceItems: PieceItem[] = [
      { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: 10 },
    ]
    const inventoryRows: Inventory[] = [
      {
        id: 'INV1',
        expense_id: 'E1',
        type: 'filament',
        name: 'PLA',
        qty_initial: 1000,
        qty_current: 990,
        created_at: '2025-01-01',
      },
    ]
    const expenses: Expense[] = [
      {
        id: 'E1',
        date: '2025-01-01',
        category: 'filament',
        amount: 20,
      },
    ]
    const m = computeClientDetailMetrics({
      clientId: 'CL1',
      jobs,
      transactions: [],
      pieces,
      pieceItems,
      inventoryRows,
      expenses,
    })
    expect(m.materialsEstimate).toBeCloseTo(10 * (20 / 1000), 6)
  })
})
