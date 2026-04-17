import { describe, it, expect } from 'vitest'
import {
  countActiveJobs,
  revenueThisMonth,
  countPiecesCompletedThisWeek,
} from './dashboardStats'
import type { Job, Piece, Transaction } from '@/types/money'

const baseJob = (overrides: Partial<Job>): Job => ({
  id: 'J1',
  client_id: 'C1',
  description: 'x',
  status: 'draft',
  created_at: '2025-01-01',
  ...overrides,
})

describe('countActiveJobs', () => {
  it('returns 0 for empty list', () => {
    expect(countActiveJobs([])).toBe(0)
  })

  it('counts draft and in_progress only', () => {
    const jobs: Job[] = [
      baseJob({ id: '1', status: 'draft' }),
      baseJob({ id: '2', status: 'in_progress' }),
      baseJob({ id: '3', status: 'delivered' }),
      baseJob({ id: '4', status: 'paid' }),
    ]
    expect(countActiveJobs(jobs)).toBe(2)
  })

  it('excludes archived jobs', () => {
    const jobs: Job[] = [
      baseJob({ id: '1', status: 'draft', archived: 'true' }),
      baseJob({ id: '2', status: 'draft' }),
    ]
    expect(countActiveJobs(jobs)).toBe(1)
  })
})

describe('revenueThisMonth', () => {
  const ref = new Date(2025, 5, 15)

  it('returns 0 for empty list', () => {
    expect(revenueThisMonth([], ref)).toBe(0)
  })

  it('sums income in reference month only', () => {
    const tx: Transaction[] = [
      {
        id: '1',
        date: '2025-06-01',
        type: 'income',
        amount: 100,
        category: 'x',
        concept: 'a',
        ref_type: 'job',
        ref_id: 'J1',
      },
      {
        id: '2',
        date: '2025-06-30',
        type: 'income',
        amount: 50,
        category: 'x',
        concept: 'b',
        ref_type: 'job',
        ref_id: 'J1',
      },
      {
        id: '3',
        date: '2025-05-31',
        type: 'income',
        amount: 999,
        category: 'x',
        concept: 'c',
        ref_type: 'job',
        ref_id: 'J1',
      },
      {
        id: '4',
        date: '2025-06-10',
        type: 'expense',
        amount: -20,
        category: 'x',
        concept: 'd',
        ref_type: '',
        ref_id: '',
      },
    ]
    expect(revenueThisMonth(tx, ref)).toBe(150)
  })

  it('excludes deleted transactions', () => {
    const tx: Transaction[] = [
      {
        id: '1',
        date: '2025-06-01',
        type: 'income',
        amount: 100,
        category: 'x',
        concept: 'a',
        ref_type: 'job',
        ref_id: 'J1',
        deleted: 'true',
      },
    ]
    expect(revenueThisMonth(tx, ref)).toBe(0)
  })
})

describe('countPiecesCompletedThisWeek', () => {
  const now = new Date('2025-06-15T12:00:00.000Z')

  it('returns 0 for empty list', () => {
    expect(countPiecesCompletedThisWeek([], now)).toBe(0)
  })

  it('counts done pieces created within rolling 7 days', () => {
    const pieces: Piece[] = [
      {
        id: 'P1',
        job_id: 'J1',
        name: 'a',
        status: 'done',
        created_at: '2025-06-14T10:00:00.000Z',
      },
      {
        id: 'P2',
        job_id: 'J1',
        name: 'b',
        status: 'done',
        created_at: '2025-06-07T10:00:00.000Z',
      },
      {
        id: 'P3',
        job_id: 'J1',
        name: 'c',
        status: 'pending',
        created_at: '2025-06-14T10:00:00.000Z',
      },
    ]
    expect(countPiecesCompletedThisWeek(pieces, now)).toBe(1)
  })
})
