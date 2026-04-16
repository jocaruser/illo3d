import { describe, it, expect, beforeEach } from 'vitest'
import { updateJob } from './updateJob'
import { matrixToJobs } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

const jobRow = {
  id: 'J1',
  client_id: 'CL1',
  description: 'Old',
  status: 'draft',
  price: '10',
  board_order: '',
  created_at: '2025-01-01',
}

describe('updateJob', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('updates description and client_id and preserves sheet price', async () => {
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [jobRow]),
    })

    await updateJob('s1', 'J1', {
      description: 'New desc',
      client_id: 'CL2',
    })

    expect(matrixToJobs(useWorkbookStore.getState().tabs.jobs)[0]).toMatchObject({
      id: 'J1',
      client_id: 'CL2',
      description: 'New desc',
      status: 'draft',
      price: 10,
      created_at: '2025-01-01',
    })
  })

  it('throws when job not found', async () => {
    resetAndSeedWorkbook({})

    await expect(
      updateJob('s1', 'J99', { description: 'A', client_id: 'CL1' }),
    ).rejects.toThrow('Job J99 not found')
  })
})
