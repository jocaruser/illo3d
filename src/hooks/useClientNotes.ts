import { useQuery } from '@tanstack/react-query'
import { fetchClientNotes } from '@/services/clientNote/fetchClientNotes'

export function useClientNotes(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['client_notes', spreadsheetId],
    queryFn: () =>
      spreadsheetId ? fetchClientNotes(spreadsheetId) : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
