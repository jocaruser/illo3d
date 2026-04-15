import { useQuery } from '@tanstack/react-query'
import { fetchCrmNotes } from '@/services/crmNote/fetchCrmNotes'

export function useCrmNotes(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['crm_notes', spreadsheetId],
    queryFn: () => fetchCrmNotes(spreadsheetId!),
    enabled: !!spreadsheetId,
  })
}
