import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToJobs } from '@/lib/workbook/workbookEntities'
import { compareJobsForKanban } from '@/utils/kanbanJobSort'
import { nextNumericId } from '@/utils/id'
import { useWorkbookStore } from '@/stores/workbookStore'

export interface CreateJobPayload {
  client_id: string
  description: string
}

export async function createJob(
  spreadsheetId: string,
  payload: CreateJobPayload
): Promise<void> {
  void spreadsheetId
  const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
  const jobId = nextNumericId(
    'J',
    jobs.map((j) => j.id).filter((id): id is string => id != null),
  )
  const createdAt = new Date().toISOString()
  const draftColumn = jobs
    .filter((j) => j.status === 'draft')
    .sort(compareJobsForKanban)
  const maxOrder = draftColumn.reduce(
    (m, j) => Math.max(m, j.board_order ?? 0),
    0,
  )
  const boardOrder = maxOrder + 1000

  patchWorkbookTab('jobs', (m) =>
    appendDataRow('jobs', m, {
      id: jobId,
      client_id: payload.client_id,
      description: payload.description,
      status: 'draft',
      price: '',
      board_order: boardOrder,
      created_at: createdAt,
      archived: '',
      deleted: '',
    }),
  )
}
