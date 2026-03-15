import { useQuery } from '@tanstack/react-query'
import { fetchClients } from '@/services/sheets/clients'

export function useClients(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['clients', spreadsheetId],
    queryFn: () =>
      spreadsheetId ? fetchClients(spreadsheetId) : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
