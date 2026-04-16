import { describe, it, expect, beforeEach } from 'vitest'
import { updateJob } from './updateJob'
import { matrixToJobs } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('updateJob', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('updates description, client_id, and price', async () => {
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [
        {
          id: 'J1',
          client_id: 'CL1',
          description: 'Old',
          status: 'draft',
          price: '10',
          created_at: '2025-01-01',
        },
      ]),
    })

    await updateJob('s1', 'J1', {
      description: 'New desc',
      client_id: 'CL2',
      price: 25,
    })

    expect(matrixToJobs(useWorkbookStore.getState().tabs.jobs)[0]).toMatchObject({
      id: 'J1',
      client_id: 'CL2',
      description: 'New desc',
      status: 'draft',
      price: 25,
      created_at: '2025-01-01',
    })
  })

  it('clears price when undefined', async () => {
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [
        {
          id: 'J1',
          client_id: 'CL1',
          description: 'X',
          status: 'draft',
          price: '10',
          created_at: '2025-01-01',
        },
      ]),
    })

    await updateJob('s1', 'J1', {
      description: 'X',
      client_id: 'CL1',
    })

    const job = matrixToJobs(useWorkbookStore.getState().tabs.jobs)[0]
    expect(job?.price).toBeUndefined()
  })

  it('throws when job not found', async () => {
    resetAndSeedWorkbook({})

    await expect(
      updateJob('s1', 'J99', { description: 'A', client_id: 'CL1' }),
    ).rejects.toThrow('Job J99 not found')
  })
})
