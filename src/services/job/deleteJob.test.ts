import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteJob } from './deleteJob'
import * as lifecycle from '@/services/lifecycle/lifecycle'

describe('deleteJob', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('archives the job via lifecycle', async () => {
    const spy = vi.spyOn(lifecycle, 'archiveJob').mockImplementation(() => {})
    await deleteJob('s1', 'J1')
    expect(spy).toHaveBeenCalledWith('J1')
  })
})
