import { useQuery } from '@tanstack/react-query'
import { fetchPieceItems } from '@/services/sheets/pieceItems'

export function usePieceItems(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['piece_items', spreadsheetId],
    queryFn: () =>
      spreadsheetId ? fetchPieceItems(spreadsheetId) : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
