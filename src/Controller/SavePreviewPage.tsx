import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { EmptyState } from '@/Component/EmptyState'
import { AuditTable } from '@/Component/audit/AuditTable'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import { RowDiffCard } from '@/Component/save/RowDiffCard'
import { SaveSheetNav, type SaveSheetNavItem } from '@/Component/save/SaveSheetNav'
import { saveSheetStatus, type SaveRun } from '@/Component/save/saveSheetStatus'
import { SHEET_NAMES, type SheetName } from '@/Config/schema'
import { useEntityManager } from '@/Hook/useEntityManager'
import { useWorkbookService } from '@/Hook/useWorkbookService'
import { SaveReviewService } from '@/Service/SaveReview/SaveReviewService'
import { computeSaveDiff, unsavedAuditEntries } from '@/Service/SaveReview/saveDiff'
import { workbookTabAccess } from '@/Store/TabAccess'
import { useOperationStore, type OperationProgress } from '@/Store/operationStore'
import { useWorkbookStore } from '@/Store/workbookStore'

/**
 * The save preview: what pressing Save will write, before it writes. A sheet
 * nav of step cards on one side, a git-style diff of every pending row on the
 * other, and the only two exits the spec allows — Save all and Discard all
 * (plus reverting individual fields in place).
 */
export function SavePreviewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tabs = useWorkbookStore((state) => state.tabs)
  const savedAuditRows = useWorkbookStore((state) => state.savedAuditRows)
  const dirty = useWorkbookStore((state) => state.dirty)
  const saveInProgress = useWorkbookStore((state) => state.saveInProgress)
  const operation = useOperationStore((state) => state.operation)
  const { save, refresh, confirmRefresh, cancelRefresh, needsConfirm, ready } =
    useWorkbookService()
  const em = useEntityManager()

  const [selectedSheet, setSelectedSheet] = useState<SheetName | null>(null)
  const [showUnchanged, setShowUnchanged] = useState(false)
  /**
   * A finished run stays on screen — all-green cards after success, red cards
   * after a failure — until the workbook changes again.
   */
  const [lastRun, setLastRun] = useState<SaveRun | null>(null)

  // Any new edit (including a revert) makes the finished run stale.
  useEffect(() => {
    setLastRun(null)
  }, [tabs])

  const diff = useMemo(
    () => computeSaveDiff(unsavedAuditEntries(tabs, savedAuditRows)),
    [tabs, savedAuditRows]
  )
  const reviewService = useMemo(
    () => new SaveReviewService(workbookTabAccess(), em.audit),
    [em]
  )

  const sheetChanges = (sheet: SheetName): number =>
    sheet === 'audit_log'
      ? diff.newAuditEntries.length
      : (diff.rowsBySheet[sheet]?.length ?? 0)
  const changedSheets = SHEET_NAMES.filter((sheet) => sheetChanges(sheet) > 0)

  const run: SaveRun | null =
    saveInProgress && operation !== null && operation.kind === 'save'
      ? {
          doneSheets: operation.doneSheets,
          failedSheets: operation.failedSheets,
          active: true,
        }
      : lastRun

  const items: SaveSheetNavItem[] = SHEET_NAMES.map((sheet) => {
    const changes = sheetChanges(sheet)
    return {
      sheet,
      status: saveSheetStatus(sheet, changes > 0, run),
      detail:
        changes === 0
          ? undefined
          : sheet === 'audit_log'
            ? t('savePreview.newEntries', { count: changes })
            : t('savePreview.rowsChanged', { count: changes }),
    }
  })

  const selected = selectedSheet ?? changedSheets[0] ?? 'clients'
  const selectedRows = selected === 'audit_log' ? [] : (diff.rowsBySheet[selected] ?? [])
  const busy = saveInProgress || !ready

  const handleSaveAll = async (): Promise<void> => {
    setLastRun(null)
    // `finish()` clears the operation store even when the save is over, so
    // keep our own copy of the last progress to leave the finished cards
    // (green or red) on screen.
    const lastOperation: { current: OperationProgress | null } = { current: null }
    const unsubscribe = useOperationStore.subscribe((state) => {
      if (state.operation !== null) lastOperation.current = state.operation
    })
    const saved = await save({ blocking: false })
    unsubscribe()
    if (saved) {
      // The review stays open: every sheet was written, so every card is green.
      setLastRun({
        doneSheets: lastOperation.current?.doneSheets ?? [...SHEET_NAMES],
        failedSheets: [],
        active: false,
      })
      return
    }
    if (lastOperation.current !== null) {
      const { doneSheets, failedSheets } = lastOperation.current
      setLastRun({ doneSheets, failedSheets, active: false })
    }
  }

  return (
    <div data-testid="save-preview-page" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">
            {t('savePreview.title')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t('savePreview.subtitle')}
            {changedSheets.length > 0 && (
              <span className="ml-2" data-testid="save-preview-count">
                {t('savePreview.unsavedSheets', { count: changedSheets.length })}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="save-preview-toggle-unchanged"
            className="btn-secondary flex items-center gap-1.5 py-1.5 text-sm"
            aria-pressed={showUnchanged}
            onClick={() => {
              setShowUnchanged((current) => !current)
            }}
          >
            {showUnchanged ? (
              <EyeSlashIcon className="h-4 w-4" aria-hidden="true" />
            ) : (
              <EyeIcon className="h-4 w-4" aria-hidden="true" />
            )}
            {showUnchanged
              ? t('savePreview.hideUnchanged')
              : t('savePreview.showUnchanged')}
          </button>
          <button
            type="button"
            data-testid="save-preview-discard-all"
            className="btn-secondary py-1.5 text-sm text-danger"
            disabled={busy || !dirty}
            onClick={() => {
              void refresh()
            }}
          >
            {t('savePreview.discardAll')}
          </button>
          <button
            type="button"
            data-testid="save-preview-save-all"
            className="btn-primary py-1.5 text-sm"
            disabled={busy || !dirty}
            onClick={() => {
              void handleSaveAll()
            }}
          >
            {t('savePreview.saveAll')}
          </button>
        </div>
      </div>

      {!dirty && changedSheets.length === 0 && run === null ? (
        <EmptyState
          message={t('savePreview.allClean')}
          action={
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => {
                navigate(-1)
              }}
            >
              {t('savePreview.back')}
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="md:w-56 md:shrink-0">
            <SaveSheetNav
              items={items}
              selected={selected}
              onSelect={setSelectedSheet}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            {selected === 'audit_log' ? (
              diff.newAuditEntries.length === 0 ? (
                <EmptyState message={t('savePreview.noChanges')} />
              ) : (
                <AuditTable
                  entries={[...diff.newAuditEntries].reverse()}
                  emptyMessage={t('savePreview.noChanges')}
                />
              )
            ) : selectedRows.length === 0 ? (
              <EmptyState message={t('savePreview.noChanges')} />
            ) : (
              selectedRows.map((row) => (
                <RowDiffCard
                  key={`${row.sheet}:${row.entityId}`}
                  row={row}
                  showUnchanged={showUnchanged}
                  onRevertField={
                    busy
                      ? undefined
                      : (column, before) => {
                          reviewService.revertField(
                            row.entityName,
                            row.entityId,
                            column,
                            before
                          )
                        }
                  }
                />
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={needsConfirm}
        title={t('workbook.discardTitle')}
        message={t('workbook.discardMessage')}
        confirmLabel={t('workbook.discardConfirm')}
        cancelLabel={t('workbook.cancel')}
        onConfirm={() => {
          void confirmRefresh()
        }}
        onCancel={cancelRefresh}
      />
    </div>
  )
}
