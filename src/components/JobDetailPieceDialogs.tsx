import { useTranslation } from 'react-i18next'
import { CreatePiecePopup } from './CreatePiecePopup'
import { ConfirmDialog } from './ConfirmDialog'
import type { Job, Piece, PieceStatus } from '@/types/money'

type PieceStatusFlow =
  | null
  | {
      piece: Piece
      nextStatus: PieceStatus
      mode: 'consume' | 'restore'
    }

interface JobDetailPieceDialogsProps {
  spreadsheetId: string | null
  jobs: Job[]
  jobId: string
  createOpen: boolean
  onCloseCreate: () => void
  pieceStatus: {
    flow: PieceStatusFlow
    decrementInventory: boolean
    restoreInventory: boolean
    error: string | null
  }
  onSetPieceStatus: (
    update: Partial<{
      flow: PieceStatusFlow
      decrementInventory: boolean
      restoreInventory: boolean
      error: string | null
    }>
  ) => void
  onCommitPieceStatus: (
    piece: Piece,
    next: PieceStatus,
    options: { decrementInventory: boolean; restoreInventory: boolean }
  ) => void
  consumeShortfall: { id: string; need: number; have: number }[]
}

export function JobDetailPieceDialogs({
  spreadsheetId,
  jobs,
  jobId,
  createOpen,
  onCloseCreate,
  pieceStatus,
  onSetPieceStatus,
  onCommitPieceStatus,
  consumeShortfall,
}: JobDetailPieceDialogsProps) {
  const { t } = useTranslation()

  return (
    <>
      <CreatePiecePopup
        isOpen={createOpen}
        onClose={onCloseCreate}
        onSuccess={() => {}}
        spreadsheetId={spreadsheetId}
        jobs={jobs}
        presetJobId={jobId}
      />

      <ConfirmDialog
        isOpen={pieceStatus.flow?.mode === 'consume'}
        title={t('pieces.confirmConsumeTitle')}
        message={
          consumeShortfall.length > 0
            ? t('pieces.confirmConsumeLowStock')
            : t('pieces.confirmConsumeMessage')
        }
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => {
          onSetPieceStatus({ flow: null, error: null, decrementInventory: true })
        }}
        onConfirm={() => {
          if (!pieceStatus.flow || pieceStatus.flow.mode !== 'consume') return
          onCommitPieceStatus(
            pieceStatus.flow.piece,
            pieceStatus.flow.nextStatus,
            {
              decrementInventory: pieceStatus.decrementInventory,
              restoreInventory: false,
            }
          )
        }}
      >
        {consumeShortfall.length > 0 ? (
          <ul className="mb-3 list-inside list-disc text-sm text-amber-800 dark:text-amber-200">
            {consumeShortfall.map((s) => (
              <li key={s.id}>
                {t('pieces.shortfallLine', {
                  id: s.id,
                  need: s.need,
                  have: s.have,
                })}
              </li>
            ))}
          </ul>
        ) : null}
        <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={pieceStatus.decrementInventory}
            onChange={(e) =>
              onSetPieceStatus({ decrementInventory: e.target.checked })
            }
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>{t('pieces.decrementInventoryLabel')}</span>
        </label>
        {pieceStatus.error ? (
          <p className="mt-3 text-sm text-danger">{pieceStatus.error}</p>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={pieceStatus.flow?.mode === 'restore'}
        title={t('pieces.confirmRestoreTitle')}
        message={t('pieces.confirmRestoreMessage')}
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => {
          onSetPieceStatus({ flow: null, error: null, restoreInventory: true })
        }}
        onConfirm={() => {
          if (!pieceStatus.flow || pieceStatus.flow.mode !== 'restore') return
          onCommitPieceStatus(
            pieceStatus.flow.piece,
            pieceStatus.flow.nextStatus,
            {
              decrementInventory: false,
              restoreInventory: pieceStatus.restoreInventory,
            }
          )
        }}
      >
        <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={pieceStatus.restoreInventory}
            onChange={(e) =>
              onSetPieceStatus({ restoreInventory: e.target.checked })
            }
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>{t('pieces.restoreInventoryLabel')}</span>
        </label>
        {pieceStatus.error ? (
          <p className="mt-3 text-sm text-danger">{pieceStatus.error}</p>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
