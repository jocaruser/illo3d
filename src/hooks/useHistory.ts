import { useQuery } from '@tanstack/react-query'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixToHistory } from '@/lib/workbook/workbookEntities'
import type { History } from '@/types/money'

const HISTORY_QUERY_KEY = 'history'

export function useHistory() {
  const { tabs, status } = useWorkbookStore()

  return useQuery<History[]>({
    queryKey: [HISTORY_QUERY_KEY],
    queryFn: () => {
      return matrixToHistory(tabs.history)
    },
    enabled: status === 'ready',
    staleTime: 0, // Always fresh since it's local data
  })
}

export function useHistoryEntry(historyId: string | undefined) {
  const { data: history, ...rest } = useHistory()

  return {
    data: history?.find((h) => h.id === historyId),
    ...rest,
  }
}
