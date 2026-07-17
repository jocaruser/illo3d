import { describe, expect, it } from 'vitest'
import { Job } from '@/Entity/Job'
import { Piece } from '@/Entity/Piece'
import { Transaction } from '@/Entity/Transaction'
import {
  activeJobsCount,
  piecesDoneThisWeek,
  revenueThisMonth,
} from '@/Service/Pricing/dashboardStats'
import { FixedClock } from '../helpers'

const clock = new FixedClock('2026-07-16T12:00:00.000Z')

describe('activeJobsCount', () => {
  it('counts active draft/in_progress jobs only', () => {
    const jobs = [
      Job.fromRecord({ id: 'J1', status: 'draft' }),
      Job.fromRecord({ id: 'J2', status: 'in_progress' }),
      Job.fromRecord({ id: 'J3', status: 'delivered' }),
      Job.fromRecord({ id: 'J4', status: 'paid' }),
      Job.fromRecord({ id: 'J5', status: 'draft', archived: 'true' }),
      Job.fromRecord({ id: 'J6', status: 'draft', deleted: 'true' }),
    ]
    expect(activeJobsCount(jobs)).toBe(2)
  })
})

describe('revenueThisMonth', () => {
  function transaction(fields: Record<string, string>): Transaction {
    return Transaction.fromRecord({ id: 'T1', type: 'income', amount: '10', ...fields })
  }

  it("sums active income within the clock's current month", () => {
    const transactions = [
      transaction({ date: '2026-07-01' }),
      transaction({ date: '2026-07-31', amount: '5.5' }),
      transaction({ date: '2026-06-30' }),
      transaction({ date: '2026-07-10', type: 'expense', amount: '-4' }),
      transaction({ date: '2026-07-11', archived: 'true' }),
      transaction({ date: '2026-07-12', deleted: 'true' }),
      transaction({ date: '2026-07-13', amount: '' }),
    ]
    expect(revenueThisMonth(transactions, clock)).toBe(15.5)
  })

  it('is 0 with no matching transactions', () => {
    expect(revenueThisMonth([], clock)).toBe(0)
  })
})

describe('piecesDoneThisWeek', () => {
  function piece(fields: Record<string, string>): Piece {
    return Piece.fromRecord({ id: 'P1', job_id: 'J1', status: 'done', ...fields })
  }

  it('counts active done pieces created within 7 days of the clock', () => {
    const pieces = [
      piece({ created_at: '2026-07-15T12:00:00.000Z' }),
      piece({ created_at: '2026-07-09T12:00:00.000Z' }), // exactly the cutoff
      piece({ created_at: '2026-07-09T11:59:59.000Z' }), // one second too old
      piece({ created_at: '2026-07-15T12:00:00.000Z', status: 'pending' }),
      piece({ created_at: '2026-07-15T12:00:00.000Z', status: 'failed' }),
      piece({ created_at: '2026-07-15T12:00:00.000Z', archived: 'true' }),
      piece({ created_at: 'not-a-date' }),
      piece({ created_at: '' }),
    ]
    expect(piecesDoneThisWeek(pieces, clock)).toBe(2)
  })
})
