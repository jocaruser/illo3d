import { describe, it, expect, beforeEach } from 'vitest'
import { applyKanbanDrop } from './applyKanbanDrop'
import { matrixToJobs } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('applyKanbanDrop', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('reorders within the same column using board_order', async () => {
    resetAndSeedWorkbook({
      jobs: matrixWithRows('jobs', [
        {
          id: 'J1',
          client_id: 'CL1',
          description: 'A',
          status: 'draft',
          price: '',
          board_order: 1000,
          created_at: '2025-01-01',
        },
        {
          id: 'J2',
          client_id: 'CL1',
          description: 'B',
          status: 'draft',
          price: '',
          board_order: 2000,
          created_at: '2025-01-02',
        },
      ]),
    })

    const r = await applyKanbanDrop('s1', 'J2', 'draft', 'J1')
    expect(r).toBe('ok')

    const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
    const draft = jobs
      .filter((j) => j.status === 'draft')
      .sort((a, b) => (a.board_order ?? 0) - (b.board_order ?? 0))
    expect(draft.map((j) => j.id)).toEqual(['J2', 'J1'])
    expect(draft[0]?.board_order).toBe(1000)
    expect(draft[1]?.board_order).toBe(2000)
  })
})
