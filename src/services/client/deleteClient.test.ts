import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteClient } from './deleteClient'
import * as lifecycle from '@/services/lifecycle/lifecycle'

describe('deleteClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('archives the client via lifecycle', async () => {
    const spy = vi.spyOn(lifecycle, 'archiveClient').mockImplementation(() => {})
    await deleteClient('s1', 'CL1')
    expect(spy).toHaveBeenCalledWith('CL1')
  })
})
