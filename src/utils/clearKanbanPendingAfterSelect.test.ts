import { describe, it, expect } from 'vitest'
import { clearKanbanPendingAfterSelect } from './clearKanbanPendingAfterSelect'

describe('clearKanbanPendingAfterSelect', () => {
  it('clears pending ref when status select was blocked (e.g. incomplete pricing)', () => {
    const ref: { current: unknown } = {
      current: { jobId: 'J1', fromStatus: 'draft', targetStatus: 'paid' },
    }
    clearKanbanPendingAfterSelect('blocked', ref)
    expect(ref.current).toBeNull()
  })

  it('does not clear ref for dialog-opened or committed', () => {
    const payload = { jobId: 'J1' }
    const ref: { current: unknown } = { current: payload }
    clearKanbanPendingAfterSelect('dialog-opened', ref)
    expect(ref.current).toBe(payload)

    const ref2: { current: unknown } = { current: payload }
    clearKanbanPendingAfterSelect('committed', ref2)
    expect(ref2.current).toBe(payload)
  })
})
