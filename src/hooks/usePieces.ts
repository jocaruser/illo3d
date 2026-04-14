import { useQuery } from '@tanstack/react-query'
import { fetchPieces } from '@/services/sheets/pieces'

export function usePieces(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['pieces', spreadsheetId],
    queryFn: () =>
      spreadsheetId ? fetchPieces(spreadsheetId) : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
