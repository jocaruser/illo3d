import { useQuery } from '@tanstack/react-query'
import { fetchJobs } from '@/services/sheets/jobs'

export function useJobs(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['jobs', spreadsheetId],
    queryFn: () =>
      spreadsheetId ? fetchJobs(spreadsheetId) : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
