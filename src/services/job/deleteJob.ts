import { archiveJob } from '@/services/lifecycle/lifecycle'

export async function deleteJob(
  spreadsheetId: string,
  jobId: string
): Promise<void> {
  void spreadsheetId
  archiveJob(jobId)
}
