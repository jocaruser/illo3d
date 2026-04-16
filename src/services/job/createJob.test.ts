import { describe, it, expect, beforeEach } from 'vitest'
import { createJob } from './createJob'
import { matrixToJobs } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('createJob', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('appends job with J1 id and draft status', async () => {
    resetAndSeedWorkbook({})

    await createJob('spreadsheet-1', {
      client_id: 'CL1',
      description: 'Test print',
    })

    const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      id: 'J1',
      client_id: 'CL1',
      description: 'Test print',
      status: 'draft',
    })
    expect(jobs[0].price).toBeUndefined()
    expect(jobs[0].created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('increments job id when jobs exist', async () => {
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [
        {
          id: 'J1',
          client_id: 'CL1',
          description: 'a',
          status: 'draft',
          price: '',
          board_order: '',
          created_at: '2025-01-01',
        },
        {
          id: 'J2',
          client_id: 'CL1',
          description: 'b',
          status: 'draft',
          price: '',
          board_order: '',
          created_at: '2025-01-02',
        },
      ]),
    })

    await createJob('spreadsheet-1', {
      client_id: 'CL2',
      description: 'Next',
    })

    const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
    expect(jobs.find((j) => j.id === 'J3')).toMatchObject({
      description: 'Next',
    })
    expect(jobs.find((j) => j.id === 'J3')?.price).toBeUndefined()
  })

  it('creates job with empty sheet price', async () => {
    resetAndSeedWorkbook({})

    await createJob('spreadsheet-1', {
      client_id: 'CL1',
      description: 'Gift',
    })

    expect(
      matrixToJobs(useWorkbookStore.getState().tabs.jobs)[0]?.price,
    ).toBeUndefined()
  })
})
