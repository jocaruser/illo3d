import { updateDataRowById } from '@/lib/workbook/matrixOps'
import { patchWorkbookTab } from '@/lib/workbook/patchTab'
import { matrixToJobs } from '@/lib/workbook/workbookEntities'
import { jobToJobsSheetRow } from '@/services/job/jobsSheetRow'
import { useWorkbookStore } from '@/stores/workbookStore'
import type { Job } from '@/types/money'

export interface UpdateJobPayload {
  description: string
  client_id: string
  /** Omitted or undefined means clear price in the sheet. */
  price?: number
}

export async function updateJob(
  spreadsheetId: string,
  jobId: string,
  payload: UpdateJobPayload
): Promise<void> {
  void spreadsheetId
  const jobs = matrixToJobs(useWorkbookStore.getState().tabs.jobs)
  const existing = jobs.find((r) => r.id === jobId)
  if (!existing) {
    throw new Error(`Job ${jobId} not found`)
  }
  const next: Job = {
    ...existing,
    description: payload.description.trim(),
    client_id: payload.client_id,
    price: payload.price,
  }

  patchWorkbookTab('jobs', (m) =>
    updateDataRowById('jobs', m, jobId, jobToJobsSheetRow(next)),
  )
}
