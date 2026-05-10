import { appendDataRow } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { useWorkbookStore } from '@/stores/workbookStore'
import { nextNumericId } from '@/utils/id'
import { matrixToJobs } from '@/lib/workbook/workbookEntities'

export interface CreateJobPayload {
  client_id: string
  description: string
  due_date?: string
}

export async function createJob(
  spreadsheetId: string,
  payload: CreateJobPayload
): Promise<string> {
  void spreadsheetId
  const existingJobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
  const existingIds = existingJobs.map((j) => j.id)
  const jobId = nextNumericId('J', existingIds)
  const createdAt = new Date().toISOString()

  patchWorkbookTab('jobs', (m) =>
    appendDataRow('jobs', m, {
      id: jobId,
      client_id: payload.client_id,
      description: payload.description,
      price: '',
      due_date: payload.due_date ?? '',
      completed: '',
      created_at: createdAt,
      archived: '',
      deleted: '',
    }),
  )
  return jobId
}