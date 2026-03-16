import { useQuery } from '@tanstack/react-query'
import { fetchExpenses } from '@/services/sheets/expenses'

export function useExpenses(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['expenses', spreadsheetId],
    queryFn: () =>
      spreadsheetId ? fetchExpenses(spreadsheetId) : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
