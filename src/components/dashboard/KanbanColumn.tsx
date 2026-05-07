import { Fragment, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Inventory, Job, JobStatus, Lot, Piece, PieceItem } from '@/types/money'
import { ColoredNumber } from '@/components/ColoredNumber'
import { JobPricingTotalDisplay } from '@/components/JobPricingTotalDisplay'
import { jobDueDateGradient } from '@/utils/jobDueDateGradient'
import { jobMaterialCost } from '@/utils/jobMaterialCost'
import { jobPricingState } from '@/utils/jobPiecePricing'
import { formatCurrency } from '@/utils/money'
import {
  KANBAN_JOB_DRAG_MIME,
  beginKanbanJobDrag,
  endKanbanJobDrag,
  getKanbanJobDragId,
  isKanbanJobDragEvent,
} from './kanbanDnd'

const CANCELLED_CAP = 10

interface KanbanColumnProps {
  status: JobStatus
  jobs: Job[]
  pieces: Piece[]
  pieceItems: PieceItem[]
  inventory: Inventory[]
  lots: Lot[]
  clientsById: Map<string, string>
  columnTitle: string
  onDropJob: (
    jobId: string,
    targetStatus: JobStatus,
    insertBeforeId: string | null,
  ) => void
  statusUpdatingId: string | null
  statusOptions: { value: string; label: string }[]
}

function KanbanDropGap({
  insertBeforeId,
  status,
  onDropJob,
  className = '',
  children,
}: {
  insertBeforeId: string | null
  status: JobStatus
  onDropJob: KanbanColumnProps['onDropJob']
  className?: string
  children?: ReactNode
}) {
  const [over, setOver] = useState(false)

  return (
    <div
      className={`rounded transition-colors ${over ? 'bg-blue-100/60' : 'bg-transparent'} ${className}`}
      onDragEnter={(e) => {
        if (!isKanbanJobDragEvent(e)) return
        e.preventDefault()
        e.stopPropagation()
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false)
      }}
      onDragOver={(e) => {
        if (!isKanbanJobDragEvent(e)) return
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => {
        setOver(false)
        if (!isKanbanJobDragEvent(e)) return
        e.preventDefault()
        e.stopPropagation()
        const id =
          e.dataTransfer.getData(KANBAN_JOB_DRAG_MIME) ||
          e.dataTransfer.getData('text/plain') ||
          getKanbanJobDragId() ||
          ''
        endKanbanJobDrag()
        if (id) onDropJob(id.trim(), status, insertBeforeId)
      }}
    >
      {children}
    </div>
  )
}

export function KanbanColumn({
  status,
  jobs,
  pieces,
  pieceItems,
  inventory,
  lots,
  clientsById,
  columnTitle,
  onDropJob,
  statusUpdatingId,
  statusOptions,
}: KanbanColumnProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [columnDragOver, setColumnDragOver] = useState(false)
  const suppressClickAfterDragRef = useRef(false)

  const isCancelled = status === 'cancelled'
  const orderedJobs = jobs
  const visibleJobs = isCancelled ? orderedJobs.slice(0, CANCELLED_CAP) : orderedJobs
  const showViewAll = isCancelled && orderedJobs.length > CANCELLED_CAP

  return (
    <div className="flex h-full min-h-[min(28rem,50vh)] w-64 shrink-0 flex-col rounded-lg border border-border bg-surface">
      <div className="border-b border-border px-3 py-2">
        <h3 className="text-sm font-semibold text-text">{columnTitle}</h3>
        <p className="text-xs text-text-muted/60">
          {orderedJobs.length}{' '}
          {orderedJobs.length === 1
            ? t('dashboard.kanban.jobSingular')
            : t('dashboard.kanban.jobPlural')}
        </p>
      </div>
      <div
        className={`flex min-h-0 flex-1 flex-col transition-colors ${
          columnDragOver ? 'bg-blue-50 dark:bg-blue-950/80 ring-2 ring-inset ring-blue-300' : ''
        }`}
        onDragEnter={(e) => {
          if (!isKanbanJobDragEvent(e)) return
          e.preventDefault()
          setColumnDragOver(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setColumnDragOver(false)
          }
        }}
        onDragOver={(e) => {
          if (!isKanbanJobDragEvent(e)) return
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
          {orderedJobs.length === 0 ? (
            <KanbanDropGap
              insertBeforeId={null}
              status={status}
              onDropJob={onDropJob}
              className="flex min-h-[12rem] flex-1 flex-col items-center justify-center px-1"
            >
              <p className="pointer-events-none text-center text-sm text-text-muted">
                {t('dashboard.kanban.empty')}
              </p>
            </KanbanDropGap>
          ) : (
            <>
              <KanbanDropGap
                insertBeforeId={orderedJobs[0]?.id ?? null}
                status={status}
                onDropJob={onDropJob}
                className="min-h-[10px] shrink-0"
              />
              {visibleJobs.map((job, idx) => {
                const due = jobDueDateGradient(job.created_at)
                const pricing = jobPricingState(job.id, pieces)
                const piecesForJob = pieces.filter((p) => p.job_id === job.id)
                const material = jobMaterialCost(
                  piecesForJob,
                  pieceItems,
                  inventory,
                  lots,
                )
                const benefit =
                  pricing.kind === 'complete'
                    ? pricing.total - material
                    : null
                return (
                <Fragment key={job.id}>
                  <div
                    data-testid={`kanban-drag-${job.id}`}
                    draggable={statusUpdatingId !== job.id}
                    onDragStart={(e) => {
                      if (statusUpdatingId === job.id) {
                        e.preventDefault()
                        return
                      }
                      suppressClickAfterDragRef.current = true
                      beginKanbanJobDrag(job.id)
                      e.dataTransfer.setData(KANBAN_JOB_DRAG_MIME, job.id)
                      e.dataTransfer.setData('text/plain', job.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => {
                      endKanbanJobDrag()
                      window.setTimeout(() => {
                        suppressClickAfterDragRef.current = false
                      }, 0)
                    }}
                    className={`overflow-hidden rounded-md border border-border bg-surface-elevated shadow-sm hover:border-blue-300 hover:shadow ${
                      statusUpdatingId === job.id ? 'opacity-60' : ''
                    } ${statusUpdatingId === job.id ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    <div className="flex">
                      {due.days >= 3 && (
                        <div
                          className={`w-1 shrink-0 ${due.bgClass.replace('bg-', 'bg-').replace('dark:bg-', 'dark:bg-')}`}
                          style={{
                            backgroundColor: undefined,
                          }}
                          aria-hidden="true"
                        />
                      )}
                      <div
                        role="link"
                        tabIndex={0}
                        className="min-w-0 flex-1 p-3 hover:bg-surface/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
                        onClick={() => {
                          if (suppressClickAfterDragRef.current) return
                          navigate(`/jobs/${job.id}`)
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return
                          e.preventDefault()
                          if (suppressClickAfterDragRef.current) return
                          navigate(`/jobs/${job.id}`)
                        }}
                      >
                        <p className="line-clamp-2 text-sm font-medium text-text">
                          {job.description}
                        </p>
                        <p className="mt-1 truncate text-xs text-text-muted">
                          {clientsById.get(job.client_id) ?? ''}
                        </p>
                        <div className="mt-1 flex items-center gap-1">
                          <JobPricingTotalDisplay
                            jobId={job.id}
                            pieces={pieces}
                            t={t}
                            size="compact"
                          />
                          {benefit !== null && (
                            <ColoredNumber
                              value={benefit}
                              className="text-xs tabular-nums"
                            >
                              {`(${formatCurrency(benefit)})`}
                            </ColoredNumber>
                          )}
                        </div>
                        <select
                          className="sr-only focus:not-sr-only focus:mt-1 focus:w-full focus:rounded focus:border focus:border-gray-300 focus:bg-white focus:px-1 focus:py-0.5 focus:text-xs dark:focus:border-gray-600 dark:focus:bg-gray-800 dark:focus:text-gray-200"
                          aria-label={t('dashboard.kanban.moveToColumn')}
                          value={status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const next = e.target.value as JobStatus
                            if (next !== status) onDropJob(job.id, next, null)
                          }}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  {idx === visibleJobs.length - 1 ? (
                    <KanbanDropGap
                      insertBeforeId={null}
                      status={status}
                      onDropJob={onDropJob}
                      className="min-h-[12px] shrink-0 grow basis-8"
                    />
                  ) : (
                    <KanbanDropGap
                      insertBeforeId={orderedJobs[idx + 1]?.id ?? null}
                      status={status}
                      onDropJob={onDropJob}
                      className="min-h-[10px] shrink-0"
                    />
                  )}
                </Fragment>
              )})}
            </>
          )}
          {showViewAll ? (
            <Link
              to="/jobs"
              className="mt-1 block shrink-0 rounded-md border border-dashed border-border px-3 py-2 text-center text-sm font-medium text-primary hover:bg-surface-elevated"
            >
              {t('dashboard.kanban.viewAll')}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
