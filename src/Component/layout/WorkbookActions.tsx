import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useWorkbookService } from '@/Hook/useWorkbookService'
import { computeSaveDiff, countPendingSaveChanges, unsavedAuditEntries } from '@/Service/SaveReview/saveDiff'
import { useWorkbookStore } from '@/Store/workbookStore'

interface WorkbookActionsProps {
  /**
   * The header renders these actions twice — inline on desktop, in their own row
   * on mobile — and CSS hides one. Both are in the DOM, so each instance needs
   * its own test id namespace to stay individually addressable.
   */
  testIdPrefix?: string
}

/**
 * Opens the save preview from the workbook toolbar. Discard and the actual write
 * live on that page; this control only navigates there.
 */
export function WorkbookActions({ testIdPrefix = 'workbook' }: WorkbookActionsProps = {}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { ready } = useWorkbookService()
  const tabs = useWorkbookStore((state) => state.tabs)
  const savedAuditRows = useWorkbookStore((state) => state.savedAuditRows)

  const pendingCount = useMemo(() => {
    const diff = computeSaveDiff(unsavedAuditEntries(tabs, savedAuditRows))
    return countPendingSaveChanges(diff)
  }, [tabs, savedAuditRows])

  const reviewLabel =
    pendingCount > 0
      ? t('workbook.reviewChangesWithCount', { count: pendingCount })
      : t('workbook.reviewChanges')

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="btn-primary py-1.5 text-sm"
        data-testid={`${testIdPrefix}-review`}
        disabled={!ready}
        onClick={() => {
          navigate('/save')
        }}
      >
        {reviewLabel}
      </button>
    </div>
  )
}
