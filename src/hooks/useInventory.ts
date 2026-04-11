import { useQuery } from '@tanstack/react-query'
import { fetchInventory } from '@/services/sheets/inventory'

export function useInventory(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['inventory', spreadsheetId],
    queryFn: () =>
      spreadsheetId ? fetchInventory(spreadsheetId) : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
