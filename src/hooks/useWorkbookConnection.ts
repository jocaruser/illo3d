import { useCallback } from 'react'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore, type WorkbookStatus } from '@/stores/workbookStore'
import { getSheetsRepository } from '@/services/sheets/repository'

export function useWorkbookConnection(): {
  spreadsheetId: string | null
  workbookStatus: WorkbookStatus
  workbookError: string | null
  onRetry: () => void
} {
  const spreadsheetId = useShopStore((s) => s.activeShop?.spreadsheetId ?? null)
  const workbookStatus = useWorkbookStore((s) => s.status)
  const workbookError = useWorkbookStore((s) => s.error)
  const hydrateWorkbook = useWorkbookStore((s) => s.hydrate)

  const onRetry = useCallback(() => {
    if (!spreadsheetId) return
    void hydrateWorkbook(getSheetsRepository(), spreadsheetId)
  }, [spreadsheetId, hydrateWorkbook])

  return {
    spreadsheetId,
    workbookStatus,
    workbookError,
    onRetry,
  }
}
