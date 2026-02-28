import { useQuery } from '@tanstack/react-query'
import { getAccessToken } from '@/services/sheets/client'
import { fetchTransactions } from '@/services/sheets/transactions'

export function useTransactions(spreadsheetId: string | null) {
  return useQuery({
    queryKey: ['transactions', spreadsheetId],
    queryFn: () =>
      spreadsheetId
        ? fetchTransactions(spreadsheetId, getAccessToken)
        : Promise.resolve([]),
    enabled: !!spreadsheetId,
  })
}
