import { useQuery } from '@tanstack/react-query'
import { fetchTags } from '@/services/sheets/tags'

export function useTags(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['tags', spreadsheetId],
    queryFn: () =>
      spreadsheetId ? fetchTags(spreadsheetId) : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
