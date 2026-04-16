import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { getSheetsRepository } from '@/services/sheets/repository'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { updateJob } from '@/services/job/updateJob'
import { deleteJob } from '@/services/job/deleteJob'
import type { UpdateJobPayload } from '@/services/job/updateJob'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EmptyState } from '@/components/EmptyState'
import { CreatePiecePopup } from '@/components/CreatePiecePopup'
import { CreatePieceItemPopup } from '@/components/CreatePieceItemPopup'
import { PiecesTable } from '@/components/PiecesTable'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { JobNotesSection } from '@/components/JobNotesSection'
import { JobTagsSection } from '@/components/JobTagsSection'
import { updatePieceStatus } from '@/services/piece/updatePieceStatus'
import { updatePiecePrice } from '@/services/piece/updatePiecePrice'
import type {
  Inventory,
  Job,
  JobNote,
  Piece,
  PieceItem,
  PieceStatus,
} from '@/types/money'
import { JobPricingTotalDisplay } from '@/components/JobPricingTotalDisplay'

function clientName(
  clients: { id: string; name: string }[],
  clientId: string
): string {
  const c = clients.find((x) => x.id === clientId)
  return c?.name ?? clientId
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
  const location = useLocation()
  const { jobId = '' } = useParams<{ jobId: string }>()
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const workbookStatus = useWorkbookStore((s) => s.status)
  const workbookError = useWorkbookStore((s) => s.error)
  const hydrateWorkbook = useWorkbookStore((s) => s.hydrate)

  const {
    jobs,
    clients,
    pieces: allPieces,
    pieceItems,
    inventory,
    expenses,
    crmNotes,
    tags,
    tagLinks,
  } = useWorkbookEntities()
  const jobNotes = useMemo((): JobNote[] => {
    const list = crmNotes
      .filter((n) => n.entity_type === 'job' && n.entity_id === jobId)
      .map(
        (n): JobNote => ({
          id: n.id,
          job_id: n.entity_id,
          body: n.body,
          referenced_entity_ids: n.referenced_entity_ids,
          severity: n.severity,
          created_at: n.created_at,
        })
      )
    return list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
  }, [crmNotes, jobId])

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId])

  const pieces = useMemo(
    () => allPieces.filter((p) => p.job_id === jobId),
    [allPieces, jobId]
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [expandedPieceId, setExpandedPieceId] = useState<string | null>(null)
  const [linePieceId, setLinePieceId] = useState<string | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Job | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
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

  useEffect(() => {
    if (workbookStatus !== 'ready' || !job) return
    const anchor = location.hash.replace(/^#/, '')
    if (!anchor.startsWith('piece-')) return
    const id = window.setTimeout(() => {
      document.getElementById(anchor)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }, 0)
    return () => window.clearTimeout(id)
  }, [
    workbookStatus,
    job,
    location.hash,
    pieces.length,
  ])

  const handleRetry = () => {
    if (!spreadsheetId) return
    void hydrateWorkbook(getSheetsRepository(), spreadsheetId)
  }

  const handleMutationSuccess = async () => {}

  const handleUpdateJob = async (
    jobIdParam: string,
    payload: UpdateJobPayload
  ) => {
    if (!spreadsheetId) return
    await updateJob(spreadsheetId, jobIdParam, payload)
  }

  const closeEditPopup = () => setEditingJob(null)

  const confirmArchiveJob = async () => {
    if (!spreadsheetId || !archiveTarget) return
    setArchiveError(null)
    try {
      await deleteJob(spreadsheetId, archiveTarget.id)
      setArchiveTarget(null)
      navigate('/jobs')
    } catch {
      setArchiveError(t('errors.deleteFailed'))
    }
  }

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
          label: t('jobs.colTotal'),
          value: (
            <JobPricingTotalDisplay
              jobId={job.id}
              pieces={allPieces}
              t={t}
            />
          ),
        },
        { label: t('jobs.colCreated'), value: job.created_at },
      ]
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ConnectionStatus
        status={workbookStatus}
        errorMessage={workbookError}
        onRetry={handleRetry}
      />

      {workbookStatus === 'ready' && jobId && !job && (
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

      {workbookStatus === 'ready' && job && (
        <EntityDetailPage
          backTo="/jobs"
          backLabel={t('jobs.backToList')}
          title={job.description}
          fields={detailFields}
          editLabel={t('jobs.editJob')}
          deleteLabel={t('lifecycle.archive')}
          onEdit={() => setEditingJob(job)}
          onDelete={() => {
            setArchiveError(null)
            setArchiveTarget(job)
          }}
        >
          <JobTagsSection
            spreadsheetId={spreadsheetId}
            jobId={job.id}
            tags={tags}
            tagLinks={tagLinks}
            onChanged={handleMutationSuccess}
          />

          <JobNotesSection
            spreadsheetId={spreadsheetId}
            jobId={job.id}
            notes={jobNotes}
            clients={clients}
            jobs={jobs}
            pieces={allPieces}
            onChanged={handleMutationSuccess}
          />

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

          {pieces.length === 0 ? (
            <EmptyState messageKey="pieces.empty" />
          ) : (
            <PiecesTable
              pieces={pieces}
              jobs={jobs}
              pieceItems={pieceItems}
              inventory={inventory}
              expenses={expenses}
              spreadsheetId={spreadsheetId}
              expandedPieceId={expandedPieceId}
              onToggleExpand={(id) =>
                setExpandedPieceId((cur) => (cur === id ? null : id))
              }
              onOpenAddLine={(id) => setLinePieceId(id)}
              onStatusChange={(p, next) => {
                void handlePieceStatusSelect(p, next)
              }}
              onPiecePriceCommit={async (pieceId, raw) => {
                if (!spreadsheetId) return
                const trim = raw.trim()
                let v: number | undefined
                if (trim === '') v = undefined
                else {
                  const n = parseFloat(trim)
                  if (Number.isNaN(n) || n < 0) return
                  v = n
                }
                const cur = pieces.find((p) => p.id === pieceId)?.price
                const same =
                  (v === undefined && cur === undefined) ||
                  (v !== undefined &&
                    cur !== undefined &&
                    Math.abs(v - cur) < 1e-9)
                if (same) return
                await updatePiecePrice(spreadsheetId, pieceId, v)
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
        onSuccess={handleMutationSuccess}
        spreadsheetId={spreadsheetId}
        clients={clients}
        initialJob={editingJob}
        onUpdateJob={handleUpdateJob}
      />

      <ConfirmDialog
        isOpen={!!archiveTarget}
        title={t('jobs.archiveConfirmTitle')}
        message={t('jobs.archiveConfirmMessage', {
          id: archiveTarget?.id ?? '',
        })}
        confirmLabel={t('lifecycle.archive')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => {
          setArchiveTarget(null)
          setArchiveError(null)
        }}
        onConfirm={() => {
          void confirmArchiveJob()
        }}
      >
        {archiveError ? (
          <p className="text-sm text-red-600">{archiveError}</p>
        ) : null}
      </ConfirmDialog>

      <CreatePiecePopup
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleMutationSuccess}
        spreadsheetId={spreadsheetId}
        jobs={jobs}
        presetJobId={job?.id}
      />

      <CreatePieceItemPopup
        isOpen={linePieceId != null}
        onClose={() => setLinePieceId(null)}
        onSuccess={handleMutationSuccess}
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
