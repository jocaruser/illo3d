import { useQuery } from '@tanstack/react-query'
import { getAccessToken } from '@/services/sheets/client'
import { fetchClients } from '@/services/sheets/clients'

export function useClients(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['clients', spreadsheetId],
    queryFn: () =>
      spreadsheetId
        ? fetchClients(spreadsheetId, getAccessToken)
        : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
