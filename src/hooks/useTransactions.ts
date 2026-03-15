import { useQuery } from '@tanstack/react-query'
import { fetchTransactions } from '@/services/sheets/transactions'

export function useTransactions(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['transactions', spreadsheetId],
    queryFn: () =>
      spreadsheetId ? fetchTransactions(spreadsheetId) : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
