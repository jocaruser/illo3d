import { Fragment, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import type { Job, JobStatus } from '@/Entity/Job'
import { JobCard, type KanbanCard } from './JobCard'
import { getDragJobId, type KanbanDropTarget } from './kanbanDnd'

/** Gap key standing for "append to the end of the column". */
const END_GAP = '__end__'

/** Preventing default is what marks an element as a valid drop target. */
function allowDrop(event: DragEvent<HTMLElement>): void {
  event.preventDefault()
}

/**
 * Shared tail of every drop: clear the active gap, read the dragged job and
 * hand it to the board. Gaps stop propagation so the column cannot append too.
 */
function completeDrop(
  event: DragEvent<HTMLElement>,
  target: KanbanDropTarget,
  onActivate: (gapKey: string | null) => void,
  onDropCard: (jobId: string, target: KanbanDropTarget) => void
): void {
  event.preventDefault()
  event.stopPropagation()
  onActivate(null)
  const jobId = getDragJobId(event.dataTransfer)
  if (jobId === null) return
  onDropCard(jobId, target)
}

interface DropGapProps {
  insertBeforeJobId?: string
  status: JobStatus
  active: boolean
  /** Called with the gap key on drag-over and with null when the drag leaves. */
  onActivate: (gapKey: string | null) => void
  onDropCard: (jobId: string, target: KanbanDropTarget) => void
}

/** The thin ordering target between two cards. */
function DropGap({
  insertBeforeJobId,
  status,
  active,
  onActivate,
  onDropCard,
}: DropGapProps) {
  const gapKey = insertBeforeJobId ?? END_GAP

  return (
    <div
      aria-hidden="true"
      data-testid="kanban-drop-gap"
      data-insert-before={gapKey}
      onDragOver={(event) => {
        allowDrop(event)
        onActivate(gapKey)
      }}
      onDragLeave={() => onActivate(null)}
      onDrop={(event) =>
        completeDrop(
          event,
          { status, insertBeforeJobId },
          onActivate,
          onDropCard
        )
      }
      className={cx('h-2 rounded transition-colors', active && 'bg-primary/60')}
    />
  )
}

interface KanbanColumnProps {
  status: JobStatus
  label: string
  cards: KanbanCard[]
  onDropCard: (jobId: string, target: KanbanDropTarget) => void
  onStatusChange: (job: Job, next: JobStatus) => void
}

export function KanbanColumn({
  status,
  label,
  cards,
  onDropCard,
  onStatusChange,
}: KanbanColumnProps) {
  const { t } = useTranslation()
  const [activeGap, setActiveGap] = useState<string | null>(null)

  /** Dropping on the column body (outside any gap) appends to the end. */
  const handleColumnDrop = (event: DragEvent<HTMLElement>) => {
    completeDrop(
      event,
      { status, insertBeforeJobId: undefined },
      setActiveGap,
      onDropCard
    )
  }

  const gap = (insertBeforeJobId?: string) => (
    <DropGap
      insertBeforeJobId={insertBeforeJobId}
      status={status}
      active={activeGap === (insertBeforeJobId ?? END_GAP)}
      onActivate={setActiveGap}
      onDropCard={onDropCard}
    />
  )

  const count = `${cards.length} ${t(
    cards.length === 1
      ? 'dashboard.kanban.jobSingular'
      : 'dashboard.kanban.jobPlural'
  )}`

  return (
    <section
      aria-label={label}
      onDragOver={allowDrop}
      onDrop={handleColumnDrop}
      className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-surface-alt/60"
    >
      <header className="flex items-center justify-between px-3 py-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-text">
          {label}
        </h3>
        <span className="text-xs text-text-muted">{count}</span>
      </header>

      <div className="min-h-[6rem] px-2 pb-2">
        {cards.length === 0 ? (
          <p className="py-8 text-center text-xs text-text-muted">
            {t('dashboard.kanban.empty')}
          </p>
        ) : (
          <ul aria-label={label} className="flex flex-col">
            {gap(cards[0].job.id)}
            {cards.map((card, index) => (
              <Fragment key={card.job.id}>
                <JobCard card={card} onStatusChange={onStatusChange} />
                {gap(cards[index + 1]?.job.id)}
              </Fragment>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
