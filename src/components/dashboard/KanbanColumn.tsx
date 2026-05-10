import { Fragment, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Job, Piece } from '@/types/money'
import type { KanbanColumn as KanbanColumnType } from '@/types/shop'
import { jobDueDateGradient } from '@/utils/jobDueDateGradient'
import {
  KANBAN_JOB_DRAG_MIME,
  beginKanbanJobDrag,
  endKanbanJobDrag,
  getKanbanJobDragId,
  isKanbanJobDragEvent,
} from './kanbanDnd'

interface KanbanColumnProps {
  column: KanbanColumnType
  pieces: Piece[]
  jobs: Map<string, Job>
  clientsById: Map<string, string>
  onDropPiece: (pieceId: string, newStatus: string, insertBeforeId?: string | null) => void
  updatingPieceId: string | null
}

function KanbanDropGap({
  insertBeforeId,
  onDrop,
  className = '',
  children,
}: {
  insertBeforeId: string | null
  onDrop: (pieceId: string, insertBeforeId: string | null) => void
  className?: string
  children?: ReactNode
}) {
  const [over, setOver] = useState(false)

  return (
    <div
      className={`rounded transition-colors ${over ? 'bg-blue-100/60 dark:bg-blue-900/40' : 'bg-transparent'} ${className}`}
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
        if (id) onDrop(id.trim(), insertBeforeId)
      }}
    >
      {children}
    </div>
  )
}

export function KanbanColumn({
  column,
  pieces,
  jobs,
  clientsById,
  onDropPiece,
  updatingPieceId,
}: KanbanColumnProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [columnDragOver, setColumnDragOver] = useState(false)
  const suppressClickAfterDragRef = useRef(false)

  const showViewAll = pieces.length > 10
  const visiblePieces = showViewAll ? pieces.slice(0, 10) : pieces

  const handleDrop = (pieceId: string, insertBeforeId: string | null) => {
    onDropPiece(pieceId, column.name, insertBeforeId)
  }

  return (
    <div className="flex h-full min-h-[min(28rem,50vh)] w-72 shrink-0 flex-col rounded-lg border border-border bg-surface">
      {/* Header with column color */}
      <div 
        className="border-b border-border px-3 py-2"
        style={{ borderTop: `3px solid ${column.color}` }}
      >
        <h3 className="text-sm font-semibold text-text">{column.name}</h3>
        <p className="text-xs text-text-muted/60">
          {pieces.length}{' '}
          {pieces.length === 1
            ? t('dashboard.kanban.pieceSingular', 'piece')
            : t('dashboard.kanban.piecePlural', 'pieces')}
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
          {pieces.length === 0 ? (
            <KanbanDropGap
              insertBeforeId={null}
              onDrop={handleDrop}
              className="flex min-h-[12rem] flex-1 flex-col items-center justify-center px-1"
            >
              <p className="pointer-events-none text-center text-sm text-text-muted">
                {t('dashboard.kanban.empty')}
              </p>
            </KanbanDropGap>
          ) : (
            <>
              <KanbanDropGap
                insertBeforeId={pieces[0]?.id ?? null}
                onDrop={handleDrop}
                className="min-h-[10px] shrink-0"
              />
              {visiblePieces.map((piece, idx) => {
                const job = jobs.get(piece.job_id)
                const clientName = job ? clientsById.get(job.client_id) : ''
                const due = job ? jobDueDateGradient(job.created_at) : null
                
                return (
                <Fragment key={piece.id}>
                  <div
                    data-testid={`kanban-drag-${piece.id}`}
                    draggable={updatingPieceId !== piece.id}
                    onDragStart={(e) => {
                      if (updatingPieceId === piece.id) {
                        e.preventDefault()
                        return
                      }
                      suppressClickAfterDragRef.current = true
                      beginKanbanJobDrag(piece.id)
                      e.dataTransfer.setData(KANBAN_JOB_DRAG_MIME, piece.id)
                      e.dataTransfer.setData('text/plain', piece.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => {
                      endKanbanJobDrag()
                      window.setTimeout(() => {
                        suppressClickAfterDragRef.current = false
                      }, 0)
                    }}
                    className={`overflow-hidden rounded-md border border-border bg-surface-elevated shadow-sm hover:border-blue-300 hover:shadow ${
                      updatingPieceId === piece.id ? 'opacity-60' : ''
                    } ${updatingPieceId === piece.id ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    <div className="flex">
                      {/* Due date gradient indicator */}
                      {due && due.days >= 3 && (
                        <div
                          className={`w-1 shrink-0 ${due.bgClass}`}
                          aria-hidden="true"
                        />
                      )}
                      <div
                        role="link"
                        tabIndex={0}
                        className="min-w-0 flex-1 p-3 hover:bg-surface/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
                        onClick={() => {
                          if (suppressClickAfterDragRef.current) return
                          navigate(`/jobs/${piece.job_id}`)
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter' && e.key !== ' ') return
                          e.preventDefault()
                          if (suppressClickAfterDragRef.current) return
                          navigate(`/jobs/${piece.job_id}`)
                        }}
                      >
                        {/* Piece name */}
                        <p className="line-clamp-2 text-sm font-medium text-text">
                          {piece.name || `Piece ${piece.id}`}
                        </p>
                        {/* Job description */}
                        {job && (
                          <p className="mt-0.5 truncate text-xs text-text-muted">
                            {job.description}
                          </p>
                        )}
                        {/* Client name */}
                        {clientName && (
                          <p className="truncate text-xs text-text-muted/70">
                            {clientName}
                          </p>
                        )}
                        {/* Units count */}
                        {piece.units && piece.units > 1 && (
                          <p className="mt-1 text-xs text-text-muted">
                            ×{piece.units} units
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {idx === visiblePieces.length - 1 ? (
                    <KanbanDropGap
                      insertBeforeId={null}
                      onDrop={handleDrop}
                      className="min-h-[12px] shrink-0 grow basis-8"
                    />
                  ) : (
                    <KanbanDropGap
                      insertBeforeId={pieces[idx + 1]?.id ?? null}
                      onDrop={handleDrop}
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
