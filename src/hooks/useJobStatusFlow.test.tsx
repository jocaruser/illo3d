import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJobStatusFlow } from './useJobStatusFlow'
import type { Job, Piece } from '@/types/money'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const piecesState = vi.hoisted(() => ({ list: [] as Piece[] }))

vi.mock('@/stores/workbookStore', () => ({
  useSnapshotPieces: () => piecesState.list,
}))

vi.mock('@/services/job/updateJobStatus', () => ({
  updateJobStatus: vi.fn().mockResolvedValue({ id: 'J1', status: 'in_progress' }),
}))

const baseJob: Job = {
  id: 'J1',
  client_id: 'CL1',
  description: 'Job one',
  status: 'draft',
  created_at: '2025-01-01',
}

function piece(overrides: Partial<Piece> & Pick<Piece, 'id' | 'job_id'>): Piece {
  return {
    name: 'n',
    status: 'pending',
    created_at: '2025-01-01',
    ...overrides,
  }
}

describe('useJobStatusFlow handleStatusSelect', () => {
  beforeEach(() => {
    piecesState.list = []
  })

  it('returns blocked when moving to paid with incomplete piece pricing', async () => {
    piecesState.list = [piece({ id: 'P1', job_id: 'J1' })]

    const { result } = renderHook(() => useJobStatusFlow('sheet-1'))

    let selectResult: string | undefined
    await act(async () => {
      selectResult = await result.current.handleStatusSelect(baseJob, 'paid')
    })

    expect(selectResult).toBe('blocked')
    expect(result.current.statusError).toBe('jobs.paidPricingIncomplete')
  })

  it('returns blocked when moving to cancelled with incomplete piece pricing', async () => {
    piecesState.list = [piece({ id: 'P1', job_id: 'J1' })]

    const { result } = renderHook(() => useJobStatusFlow('sheet-1'))

    let selectResult: string | undefined
    await act(async () => {
      selectResult = await result.current.handleStatusSelect(baseJob, 'cancelled')
    })

    expect(selectResult).toBe('blocked')
    expect(result.current.statusError).toBe('jobs.paidPricingIncomplete')
  })

  it('returns dialog-opened when moving to cancelled with complete pricing', async () => {
    piecesState.list = [piece({ id: 'P1', job_id: 'J1', price: 10 })]

    const { result } = renderHook(() => useJobStatusFlow('sheet-1'))

    let selectResult: string | undefined
    await act(async () => {
      selectResult = await result.current.handleStatusSelect(baseJob, 'cancelled')
    })

    expect(selectResult).toBe('dialog-opened')
    expect(result.current.statusError).toBeNull()
  })
})
