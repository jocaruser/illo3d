// TODO: Remove or repurpose in v2.0.0 - replaced by completeJob
// This file is temporarily stubbed to allow compilation

import type { Job } from '@/types/money'

export interface UpdateJobStatusOptions {
  paidPrice?: number
  createIncomeTransaction?: boolean
}

export async function updateJobStatus(
  spreadsheetId: string,
  job: Job,
  newStatus: string,
  options?: UpdateJobStatusOptions
): Promise<Job> {
  void spreadsheetId
  void newStatus
  void options
  return job
}