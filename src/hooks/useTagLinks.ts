import { useQuery } from '@tanstack/react-query'
import { fetchTagLinks } from '@/services/sheets/tagLinks'

export function useTagLinks(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['audit_log', 'tag_links', spreadsheetId],
    queryFn: () =>
      spreadsheetId ? fetchTagLinks(spreadsheetId) : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
