import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { updateJob } from '@/services/job/updateJob'
import { deleteJob } from '@/services/job/deleteJob'
import type { UpdateJobPayload } from '@/services/job/updateJob'
import { CreatePiecePopup } from '@/components/CreatePiecePopup'
import { PiecesTable } from '@/components/PiecesTable'
import { ListTablePageHeader } from '@/components/list-table/ListTablePageHeader'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { JobNotesSection } from '@/components/JobNotesSection'
import { JobTagsSection } from '@/components/JobTagsSection'
import { JobWidget } from '@/components/JobWidget'
import { JobWidgetGrid } from '@/components/JobWidgetGrid'
import { JobMaterialsSummary } from '@/components/JobMaterialsSummary'
import { ColoredNumber } from '@/components/ColoredNumber'
import { jobOverallRiskFactor } from '@/utils/jobOverallRiskFactor'
import { updatePieceStatus } from '@/services/piece/updatePieceStatus'
import { updatePiecePrice } from '@/services/piece/updatePiecePrice'
import { updatePieceUnits } from '@/services/piece/updatePieceUnits'
import { updatePieceName } from '@/services/piece/updatePieceName'
import { updatePieceItem } from '@/services/piece/updatePieceItem'
import { deletePieceItem } from '@/services/piece/deletePieceItem'
import { createPieceItem, DUPLICATE_PIECE_ITEM_INVENTORY } from '@/services/piece/createPieceItem'
import { useJobStatusFlow } from '@/hooks/useJobStatusFlow'
import { Combobox } from '@/components/Combobox'
import type {
  Inventory,
  Job,
  JobNote,
  Piece,
  PieceItem,
  PieceStatus,
} from '@/types/money'
import { JobPricingTotalDisplay } from '@/components/JobPricingTotalDisplay'
import {
  effectiveNeedByInventory,
  pieceUnitsAreSet,
} from '@/utils/pieceEffectiveInventory'
import { jobPricingState } from '@/utils/jobPiecePricing'
import { jobMaterialCost } from '@/utils/jobMaterialCost'
import { jobFilamentGrams } from '@/utils/jobFilamentGrams'
import { jobConsumableUnits } from '@/utils/jobConsumableUnits'
import { jobDueDateGradient } from '@/utils/jobDueDateGradient'
import { buildMaterialsSummary } from '@/utils/jobMaterialsSummary'
import { formatCurrency } from '@/utils/money'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { NotFoundCard } from '@/components/NotFoundCard'
import { AlertBox } from '@/components/AlertBox'

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

function stockShortfall(
  piece: Piece,
  lines: PieceItem[],
  inventoryRows: Inventory[],
): { id: string; need: number; have: number }[] {
  const needByLot = effectiveNeedByInventory(piece, lines)
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
  const {
    spreadsheetId,
    workbookStatus,
  } = useWorkbookConnection()

  const {
    jobs,
    clients,
    pieces: allPieces,
    pieceItems,
    inventory,
    lots,
    crmNotes,
    tags,
    tagLinks,
  } = useWorkbookEntities()

  const {
    handleStatusSelect: handleJobStatusSelect,
    statusError: jobStatusError,
    statusUpdatingId: jobStatusUpdatingId,
    statusDialogs: jobStatusDialogs,
  } = useJobStatusFlow(spreadsheetId)

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

  const jobPricing = useMemo(
    () => (job ? jobPricingState(job.id, allPieces) : { kind: 'incomplete' as const }),
    [job, allPieces]
  )

  const materialCost = useMemo(
    () => jobMaterialCost(pieces, pieceItems, inventory, lots),
    [pieces, pieceItems, inventory, lots]
  )

  const filamentGrams = useMemo(
    () => jobFilamentGrams(pieces, pieceItems, inventory),
    [pieces, pieceItems, inventory]
  )

  const consumableUnits = useMemo(
    () => jobConsumableUnits(pieces, pieceItems, inventory),
    [pieces, pieceItems, inventory]
  )

  const dueDate = useMemo(
    () => (job ? jobDueDateGradient(job.created_at) : null),
    [job]
  )

  const materialsSummary = useMemo(
    () =>
      job
        ? buildMaterialsSummary(job.id, allPieces, pieceItems, inventory, lots)
        : [],
    [job, allPieces, pieceItems, inventory, lots]
  )

  const overallRiskFactor = useMemo(
    () =>
      job ? jobOverallRiskFactor(pieces, pieceItems, inventory) : null,
    [pieces, pieceItems, inventory]
  )

  const [createOpen, setCreateOpen] = useState(false)
  const [expandedPieceIds, setExpandedPieceIds] = useState<Set<string>>(new Set())
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Job | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [pieceStatusFlow, setPieceStatusFlow] =
    useState<PieceStatusFlow>(null)
  const [decrementInventory, setDecrementInventory] = useState(true)
  const [restoreInventory, setRestoreInventory] = useState(true)
  const [query, setQuery] = useState('')
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
    const pieceId = anchor.replace('piece-', '')
    setExpandedPieceIds((prev) => new Set([...prev, pieceId]))
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
      const msg = e instanceof Error ? e.message : ''
      if (msg === 'PIECE_UNITS_REQUIRED_FOR_CONSUMPTION') {
        setPieceStatusError(t('pieces.statusNeedsUnits'))
      } else {
        setPieceStatusError(
          e instanceof Error ? e.message : t('wizard.errorGeneric'),
        )
      }
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
        if (!pieceUnitsAreSet(piece)) {
          setLineRequirementMessage(t('pieces.statusNeedsUnits'))
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
          pieceStatusFlow.piece,
          linesForPieceId(pieceItems, pieceStatusFlow.piece.id),
          inventory,
        )
      : []

  const widgets = job
    ? [
        {
          label: t('jobs.widgetId'),
          value: (
            <div className="flex items-center justify-between gap-2">
              <span>{`${job.id} — ${job.description}`}</span>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  data-testid="entity-detail-edit"
                  onClick={() => setEditingJob(job)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface"
                >
                  {t('jobs.editJob')}
                </button>
                <button
                  type="button"
                  data-testid="entity-detail-delete"
                  onClick={() => {
                    setArchiveError(null)
                    setArchiveTarget(job)
                  }}
                  className="rounded-lg border border-red-200 dark:border-red-800 bg-surface-elevated px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:bg-red-950"
                >
                  {t('lifecycle.archive')}
                </button>
              </div>
            </div>
          ),
          colSpan: 2 as const,
        },
        {
          label: t('jobs.widgetStatus'),
          value: (
            <Combobox
              items={['draft', 'in_progress', 'delivered', 'paid', 'cancelled'] as const}
              value={job.status}
              onChange={(key) => {
                void handleJobStatusSelect(job, key as Job['status'])
              }}
              getKey={(s) => s}
              getLabel={(s) => t(`jobs.status.${s}`)}
              disabled={jobStatusUpdatingId === job.id}
              searchable={false}
            />
          ),
        },
        {
          label: t('jobs.widgetTotal'),
          value: (
            <JobPricingTotalDisplay
              jobId={job.id}
              pieces={allPieces}
              t={t}
            />
          ),
          alignRight: true,
        },
        {
          label: t('jobs.widgetClient'),
          value: (
            <Link
              to={`/clients/${job.client_id}`}
              className="text-primary hover:text-blue-800 dark:text-blue-200"
            >
              {clientName(clients, job.client_id)}
            </Link>
          ),
          colSpan: 2 as const,
        },
        {
          label: t('jobs.widgetDueDate'),
          value: dueDate?.label ?? '—',
          bgClass: dueDate?.bgClass,
          textClass: dueDate?.textClass,
        },
        {
          label: t('jobs.widgetBeneficio'),
          value:
            jobPricing.kind === 'complete'
              ? (
                <ColoredNumber
                  value={jobPricing.total - materialCost}
                  formatter={formatCurrency}
                />
              )
              : (
                <span className="inline-flex items-center rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 font-semibold text-amber-900 dark:text-amber-200 text-sm">
                  {t('jobs.totalIncomplete')}
                </span>
              ),
          alignRight: true,
        },
        {
          label: t('jobs.widgetFilament'),
          value: `${filamentGrams}g`,
        },
        {
          label: t('jobs.widgetConsumibles'),
          value: `${consumableUnits} ${t('jobs.materialsUnits')}`,
        },
        {
          label: t('jobs.widgetRiskFactor'),
          value: overallRiskFactor
            ? (() => {
                const { minRedos, inventoryName } = overallRiskFactor
                const colorClass =
                  minRedos >= 2
                    ? 'text-success'
                    : minRedos === 1
                      ? 'text-accent'
                      : 'text-danger'
                return (
                  <span className={colorClass}>
                    {t('jobs.riskFactorValue', { redos: minRedos, name: inventoryName })}
                  </span>
                )
              })()
            : '—',
          testId: 'job-widget-risk-factor',
        },
        {
          label: t('jobs.widgetMaterialCost'),
          value: <ColoredNumber value={materialCost} formatter={formatCurrency} forceRed />,
          alignRight: true,
          testId: 'job-widget-material-cost',
        },
      ]
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {workbookStatus === 'loading' && spreadsheetId ? (
        <div className="mt-8 flex justify-center" aria-busy="true">
          <LoadingSpinner />
        </div>
      ) : null}

      {workbookStatus === 'ready' && jobId && !job && (
        <NotFoundCard
          message={t('jobs.jobNotFound')}
          backTo="/jobs"
          backLabel={t('jobs.backToList')}
        />
      )}

      {workbookStatus === 'ready' && job && (
        <div>
          <div className="mb-4">
            <Link
              to="/jobs"
              data-testid="entity-detail-back"
              className="text-sm font-medium text-primary hover:text-blue-800 dark:text-blue-200"
            >
              ← {t('jobs.backToList')}
            </Link>
          </div>

          <div className="mb-8">
            <JobWidgetGrid>
          {widgets.map((w) => (
            <JobWidget
              key={w.label}
              label={w.label}
              value={w.value}
              bgClass={w.bgClass}
              textClass={w.textClass}
              colSpan={w.colSpan}
              alignRight={w.alignRight}
              testId={w.testId}
            />
          ))}
            </JobWidgetGrid>
          </div>

          {jobStatusError ? (
            <div
              className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-900 dark:text-red-200"
              role="alert"
            >
              {jobStatusError}
            </div>
          ) : null}

          <JobMaterialsSummary rows={materialsSummary} />

          <JobTagsSection
            spreadsheetId={spreadsheetId}
            jobId={job.id}
            tags={tags}
            tagLinks={tagLinks}
            onChanged={async () => {}}
          />

          <JobNotesSection
            spreadsheetId={spreadsheetId}
            jobId={job.id}
            notes={jobNotes}
            clients={clients}
            jobs={jobs}
            pieces={allPieces}
            onChanged={async () => {}}
          />

          <ListTablePageHeader
            title={t('pieces.title')}
            search={
              <ListTableSearchField
                value={query}
                onChange={setQuery}
                placeholder={t('listTable.searchPlaceholder')}
                ariaLabel={t('listTable.searchAria')}
              />
            }
            actions={
              <button
                type="button"
                data-testid="add-piece-button"
                onClick={() => {
                  setQuery('')
                  setCreateOpen(true)
                }}
                className="btn-primary"
              >
                {t('pieces.addPiece')}
              </button>
            }
          />

          {lineRequirementMessage ? (
            <AlertBox variant="warning" className="mb-4">
              {lineRequirementMessage}
            </AlertBox>
          ) : null}

          <PiecesTable
            pieces={pieces}
            query={query}
            jobs={jobs}
            pieceItems={pieceItems}
            inventory={inventory}
            lots={lots}
            spreadsheetId={spreadsheetId}
            expandedPieceIds={expandedPieceIds}
            onToggleExpand={(id) =>
              setExpandedPieceIds((prev) => {
                const next = new Set(prev)
                if (next.has(id)) {
                  next.delete(id)
                } else {
                  next.add(id)
                }
                return next
              })
            }
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
            onPieceUnitsCommit={async (pieceId, raw) => {
              if (!spreadsheetId) return
              const trim = raw.trim()
              let v: number | undefined
              if (trim === '') v = undefined
              else {
                const n = parseInt(trim, 10)
                if (Number.isNaN(n) || n < 1) return
                v = n
              }
              const cur = pieces.find((p) => p.id === pieceId)?.units
              const same =
                (v === undefined && cur === undefined) ||
                (v !== undefined &&
                  cur !== undefined &&
                  cur === v)
              if (same) return
              await updatePieceUnits(spreadsheetId, pieceId, v)
            }}
            onPieceNameCommit={async (pieceId, raw) => {
              if (!spreadsheetId) return
              const trim = raw.trim()
              if (!trim) return
              const cur = pieces.find((p) => p.id === pieceId)?.name
              if (trim === cur) return
              await updatePieceName(spreadsheetId, pieceId, trim)
            }}
            onPieceItemQuantityCommit={async (pieceItemId, raw) => {
              if (!spreadsheetId) return
              const trim = raw.trim()
              if (trim === '') return
              const n = parseFloat(trim)
              if (Number.isNaN(n) || n <= 0) return
              await updatePieceItem(spreadsheetId, pieceItemId, { quantity: n })
            }}
            onPieceItemInventoryCommit={async (pieceItemId, inventoryId) => {
              if (!spreadsheetId) return
              await updatePieceItem(spreadsheetId, pieceItemId, { inventory_id: inventoryId })
            }}
            onPieceItemDelete={async (pieceItemId) => {
              if (!spreadsheetId) return
              await deletePieceItem(spreadsheetId, pieceItemId)
            }}
            onAddPieceItem={async (pieceId) => {
              if (!spreadsheetId) return
              try {
                await createPieceItem(spreadsheetId, {
                  piece_id: pieceId,
                  inventory_id: '',
                  quantity: 1,
                })
                setExpandedPieceIds((prev) => new Set([...prev, pieceId]))
              } catch (e) {
                if (e instanceof Error && e.message === DUPLICATE_PIECE_ITEM_INVENTORY) {
                  // Ignore duplicate error - user can change inventory
                }
              }
            }}
            statusUpdatingId={pieceStatusUpdatingId}
            hideJobColumn
          />
        </div>
      )}

      <CreateJobPopup
        isOpen={editingJob !== null}
        onClose={closeEditPopup}
        onSuccess={() => {}}
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
          <p className="text-sm text-danger">{archiveError}</p>
        ) : null}
      </ConfirmDialog>

      <CreatePiecePopup
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {}}
        spreadsheetId={spreadsheetId}
        jobs={jobs}
        presetJobId={job?.id}
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
            checked={decrementInventory}
            onChange={(e) => setDecrementInventory(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>{t('pieces.decrementInventoryLabel')}</span>
        </label>
        {pieceStatusError ? (
          <p className="mt-3 text-sm text-danger">{pieceStatusError}</p>
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
        <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={restoreInventory}
            onChange={(e) => setRestoreInventory(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>{t('pieces.restoreInventoryLabel')}</span>
        </label>
        {pieceStatusError ? (
          <p className="mt-3 text-sm text-danger">{pieceStatusError}</p>
        ) : null}
      </ConfirmDialog>

      {jobStatusDialogs}
    </div>
  )
}
