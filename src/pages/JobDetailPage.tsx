import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSheetsStore } from '@/stores/sheetsStore'
import { useShopStore } from '@/stores/shopStore'
import { connect } from '@/services/sheets/connection'
import { usePieces } from '@/hooks/usePieces'
import { usePieceItems } from '@/hooks/usePieceItems'
import { useJobs } from '@/hooks/useJobs'
import { useClients } from '@/hooks/useClients'
import { useInventory } from '@/hooks/useInventory'
import { useExpenses } from '@/hooks/useExpenses'
import { updateJob } from '@/services/job/updateJob'
import { deleteJob } from '@/services/job/deleteJob'
import type { UpdateJobPayload } from '@/services/job/updateJob'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { CreatePiecePopup } from '@/components/CreatePiecePopup'
import { CreatePieceItemPopup } from '@/components/CreatePieceItemPopup'
import { PiecesTable } from '@/components/PiecesTable'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { CreateJobPopup, type SuggestedPricingInput } from '@/components/CreateJobPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { QueryError } from '@/components/QueryError'
import { updatePieceStatus } from '@/services/piece/updatePieceStatus'
import type { Inventory, Job, Piece, PieceItem, PieceStatus } from '@/types/money'
import { formatCurrency } from '@/utils/money'

function clientName(
  clients: { id: string; name: string }[],
  clientId: string
): string {
  const c = clients.find((x) => x.id === clientId)
  return c?.name ?? clientId
}

function formatJobPrice(price: number | undefined): string {
  if (price === undefined || price === null || Number.isNaN(price)) {
    return '—'
  }
  return formatCurrency(price)
}

function isConsumingPieceStatus(s: PieceStatus): boolean {
  return s === 'done' || s === 'failed'
}

function linesForPieceId(pieceItems: PieceItem[], pieceId: string): PieceItem[] {
  return pieceItems.filter((pi) => pi.piece_id === pieceId)
}

function aggregateNeedByInventory(lines: PieceItem[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const l of lines) {
    const q =
      typeof l.quantity === 'number' ? l.quantity : Number(l.quantity)
    m.set(l.inventory_id, (m.get(l.inventory_id) ?? 0) + q)
  }
  return m
}

function stockShortfall(
  lines: PieceItem[],
  inventoryRows: Inventory[]
): { id: string; need: number; have: number }[] {
  const needByLot = aggregateNeedByInventory(lines)
  const out: { id: string; need: number; have: number }[] = []
  for (const [id, need] of needByLot) {
    const row = inventoryRows.find((i) => i.id === id)
    const have = row?.qty_current ?? 0
    if (have < need) out.push({ id, need, have })
  }
  return out
}

type PieceStatusFlow =
  | null
  | {
      piece: Piece
      nextStatus: PieceStatus
      mode: 'consume' | 'restore'
    }

export function JobDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { jobId = '' } = useParams<{ jobId: string }>()
  const queryClient = useQueryClient()
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const {
    status,
    errorMessage,
    setConnecting,
    setConnected,
    setError,
  } = useSheetsStore()

  const {
    data: jobs = [],
    isLoading: jobsLoading,
    isError: jobsError,
    refetch: refetchJobs,
  } = useJobs(spreadsheetId)
  const { data: clients = [] } = useClients(spreadsheetId)
  const { data: allPieces = [], isLoading: piecesLoading } =
    usePieces(spreadsheetId)
  const { data: pieceItems = [], isLoading: itemsLoading } =
    usePieceItems(spreadsheetId)
  const { data: inventory = [] } = useInventory(spreadsheetId)
  const { data: expenses = [] } = useExpenses(spreadsheetId)

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId])

  const pieces = useMemo(
    () => allPieces.filter((p) => p.job_id === jobId),
    [allPieces, jobId]
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [expandedPieceId, setExpandedPieceId] = useState<string | null>(null)
  const [linePieceId, setLinePieceId] = useState<string | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [pieceStatusFlow, setPieceStatusFlow] =
    useState<PieceStatusFlow>(null)
  const [decrementInventory, setDecrementInventory] = useState(true)
  const [restoreInventory, setRestoreInventory] = useState(true)
  const [pieceStatusError, setPieceStatusError] = useState<string | null>(
    null
  )
  const [lineRequirementMessage, setLineRequirementMessage] = useState<
    string | null
  >(null)
  const [pieceStatusUpdatingId, setPieceStatusUpdatingId] = useState<
    string | null
  >(null)

  const suggestedPricing = useMemo((): SuggestedPricingInput | undefined => {
    if (!job || !editingJob || editingJob.id !== job.id) return undefined
    return {
      jobId: job.id,
      pieces: allPieces,
      pieceItems,
      inventory,
      expenses,
    }
  }, [job, editingJob, allPieces, pieceItems, inventory, expenses])

  useEffect(() => {
    if (!spreadsheetId) return
    setConnecting()
    connect(spreadsheetId).then((result) => {
      if (result.ok) {
        setConnected(result.spreadsheetId)
      } else {
        setError(result.error)
      }
    })
  }, [spreadsheetId, setConnecting, setConnected, setError])

  const handleRetry = async () => {
    if (!spreadsheetId) return
    setConnecting()
    const result = await connect(spreadsheetId)
    if (result.ok) {
      setConnected(result.spreadsheetId)
    } else {
      setError(result.error)
    }
  }

  const invalidatePieces = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pieces', spreadsheetId] })
  }

  const invalidatePieceItems = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['piece_items', spreadsheetId],
    })
  }

  const invalidateInventory = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['inventory', spreadsheetId],
    })
  }

  const invalidateJobs = async () => {
    await queryClient.invalidateQueries({ queryKey: ['jobs', spreadsheetId] })
  }

  const handleUpdateJob = async (
    jobIdParam: string,
    payload: UpdateJobPayload
  ) => {
    if (!spreadsheetId) return
    const key = ['jobs', spreadsheetId] as const
    const previous = queryClient.getQueryData<Job[]>(key)
    if (previous) {
      queryClient.setQueryData(
        key,
        previous.map((j) =>
          j.id === jobIdParam
            ? {
                ...j,
                description: payload.description,
                client_id: payload.client_id,
                price: payload.price,
              }
            : j
        )
      )
    }
    try {
      await updateJob(spreadsheetId, jobIdParam, payload)
    } catch (e) {
      if (previous) {
        queryClient.setQueryData(key, previous)
      }
      throw e
    }
  }

  const closeEditPopup = () => setEditingJob(null)

  const confirmDeleteJob = async () => {
    if (!spreadsheetId || !deleteTarget) return
    setDeleteError(null)
    try {
      await deleteJob(spreadsheetId, deleteTarget.id)
      setDeleteTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['jobs', spreadsheetId] })
      await queryClient.invalidateQueries({ queryKey: ['pieces', spreadsheetId] })
      await queryClient.invalidateQueries({
        queryKey: ['piece_items', spreadsheetId],
      })
      navigate('/jobs')
    } catch {
      setDeleteError(t('errors.deleteFailed'))
    }
  }

  const listLoading = piecesLoading || itemsLoading

  const commitPieceStatusChange = async (
    piece: Piece,
    next: PieceStatus,
    options: { decrementInventory: boolean; restoreInventory: boolean }
  ) => {
    if (!spreadsheetId) return
    setPieceStatusUpdatingId(piece.id)
    setPieceStatusError(null)
    try {
      const result = await updatePieceStatus(spreadsheetId, piece, next, {
        decrementInventory: options.decrementInventory,
        restoreInventory: options.restoreInventory,
      })
      if (!result.ok) {
        const detail = result.lots
          .map((l) => `${l.inventoryId}: ${l.need} / ${l.have}`)
          .join('; ')
        setPieceStatusError(
          t('pieces.statusInsufficientStockDetail', { detail })
        )
        return
      }
      await invalidatePieces()
      await invalidatePieceItems()
      await invalidateInventory()
      setPieceStatusFlow(null)
    } catch (e) {
      setPieceStatusError(
        e instanceof Error ? e.message : t('wizard.errorGeneric')
      )
    } finally {
      setPieceStatusUpdatingId(null)
    }
  }

  const handlePieceStatusSelect = (piece: Piece, next: PieceStatus) => {
    if (next === piece.status) return
    setPieceStatusError(null)
    setLineRequirementMessage(null)

    const old = piece.status
    if (isConsumingPieceStatus(next)) {
      if (!isConsumingPieceStatus(old)) {
        const lines = linesForPieceId(pieceItems, piece.id)
        if (lines.length === 0) {
          setLineRequirementMessage(t('pieces.statusNeedsLines'))
          return
        }
        setDecrementInventory(true)
        setPieceStatusFlow({
          piece,
          nextStatus: next,
          mode: 'consume',
        })
        return
      }
      void commitPieceStatusChange(piece, next, {
        decrementInventory: false,
        restoreInventory: false,
      })
      return
    }

    if (next === 'pending' && isConsumingPieceStatus(old)) {
      setRestoreInventory(true)
      setPieceStatusFlow({
        piece,
        nextStatus: next,
        mode: 'restore',
      })
      return
    }

    void commitPieceStatusChange(piece, next, {
      decrementInventory: false,
      restoreInventory: false,
    })
  }

  const consumeShortfall =
    pieceStatusFlow?.mode === 'consume'
      ? stockShortfall(
          linesForPieceId(pieceItems, pieceStatusFlow.piece.id),
          inventory
        )
      : []

  const detailFields = job
    ? [
        { label: t('jobs.colId'), value: job.id },
        {
          label: t('jobs.colClient'),
          value: clientName(clients, job.client_id),
        },
        {
          label: t('jobs.colStatus'),
          value: t(`jobs.status.${job.status}`),
        },
        {
          label: t('jobs.colPrice'),
          value: formatJobPrice(job.price),
        },
        { label: t('jobs.colCreated'), value: job.created_at },
      ]
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ConnectionStatus
        status={status}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />

      {status === 'connected' && jobsError && (
        <QueryError onRetry={() => void refetchJobs()} />
      )}

      {status === 'connected' && !jobsError && !jobsLoading && jobId && !job && (
        <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center shadow">
          <p className="text-gray-600">{t('jobs.jobNotFound')}</p>
          <Link
            to="/jobs"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            {t('jobs.backToList')}
          </Link>
        </div>
      )}

      {status === 'connected' && job && (
        <EntityDetailPage
          backTo="/jobs"
          backLabel={t('jobs.backToList')}
          title={job.description}
          fields={detailFields}
          editLabel={t('jobs.editJob')}
          deleteLabel={t('jobs.deleteJob')}
          onEdit={() => setEditingJob(job)}
          onDelete={() => setDeleteTarget(job)}
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-xl font-semibold text-gray-800">
              {t('pieces.title')}
            </h3>
            <button
              type="button"
              data-testid="add-piece-button"
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('pieces.addPiece')}
            </button>
          </div>

          {lineRequirementMessage ? (
            <div
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              role="alert"
            >
              {lineRequirementMessage}
            </div>
          ) : null}

          {listLoading ? (
            <LoadingSpinner />
          ) : pieces.length === 0 ? (
            <EmptyState messageKey="pieces.empty" />
          ) : (
            <PiecesTable
              pieces={pieces}
              jobs={jobs}
              pieceItems={pieceItems}
              inventory={inventory}
              expandedPieceId={expandedPieceId}
              onToggleExpand={(id) =>
                setExpandedPieceId((cur) => (cur === id ? null : id))
              }
              onOpenAddLine={(id) => setLinePieceId(id)}
              onStatusChange={(p, next) => {
                void handlePieceStatusSelect(p, next)
              }}
              statusUpdatingId={pieceStatusUpdatingId}
              hideJobColumn
            />
          )}
        </EntityDetailPage>
      )}

      <CreateJobPopup
        isOpen={editingJob !== null}
        onClose={closeEditPopup}
        onSuccess={() => {
          void invalidateJobs()
        }}
        spreadsheetId={spreadsheetId}
        clients={clients}
        initialJob={editingJob}
        onUpdateJob={handleUpdateJob}
        suggestedPricing={suggestedPricing}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t('jobs.confirmDeleteTitle')}
        message={t('jobs.confirmDeleteMessage', {
          id: deleteTarget?.id ?? '',
        })}
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteError(null)
        }}
        onConfirm={() => {
          void confirmDeleteJob()
        }}
      >
        {deleteError ? (
          <p className="text-sm text-red-600">{deleteError}</p>
        ) : null}
      </ConfirmDialog>

      <CreatePiecePopup
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          void invalidatePieces()
        }}
        spreadsheetId={spreadsheetId}
        jobs={jobs}
        presetJobId={job?.id}
      />

      <CreatePieceItemPopup
        isOpen={linePieceId != null}
        onClose={() => setLinePieceId(null)}
        onSuccess={() => {
          void invalidatePieceItems()
        }}
        spreadsheetId={spreadsheetId}
        pieceId={linePieceId}
        inventory={inventory}
      />

      <ConfirmDialog
        isOpen={pieceStatusFlow?.mode === 'consume'}
        title={t('pieces.confirmConsumeTitle')}
        message={
          consumeShortfall.length > 0
            ? t('pieces.confirmConsumeLowStock')
            : t('pieces.confirmConsumeMessage')
        }
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => {
          setPieceStatusFlow(null)
          setPieceStatusError(null)
          setDecrementInventory(true)
        }}
        onConfirm={() => {
          if (!pieceStatusFlow || pieceStatusFlow.mode !== 'consume') return
          void commitPieceStatusChange(
            pieceStatusFlow.piece,
            pieceStatusFlow.nextStatus,
            {
              decrementInventory,
              restoreInventory: false,
            }
          )
        }}
      >
        {consumeShortfall.length > 0 ? (
          <ul className="mb-3 list-inside list-disc text-sm text-amber-800">
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
        <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={decrementInventory}
            onChange={(e) => setDecrementInventory(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>{t('pieces.decrementInventoryLabel')}</span>
        </label>
        {pieceStatusError ? (
          <p className="mt-3 text-sm text-red-600">{pieceStatusError}</p>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={pieceStatusFlow?.mode === 'restore'}
        title={t('pieces.confirmRestoreTitle')}
        message={t('pieces.confirmRestoreMessage')}
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => {
          setPieceStatusFlow(null)
          setPieceStatusError(null)
          setRestoreInventory(true)
        }}
        onConfirm={() => {
          if (!pieceStatusFlow || pieceStatusFlow.mode !== 'restore') return
          void commitPieceStatusChange(
            pieceStatusFlow.piece,
            pieceStatusFlow.nextStatus,
            {
              decrementInventory: false,
              restoreInventory,
            }
          )
        }}
      >
        <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={restoreInventory}
            onChange={(e) => setRestoreInventory(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>{t('pieces.restoreInventoryLabel')}</span>
        </label>
        {pieceStatusError ? (
          <p className="mt-3 text-sm text-red-600">{pieceStatusError}</p>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
