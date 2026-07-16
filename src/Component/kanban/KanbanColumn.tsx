import { Fragment, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from '@/Component/cx'
import type { Job, JobStatus } from '@/Entity/Job'
import { JobCard, type KanbanCard } from './JobCard'
import { getDragJobId, type KanbanDropTarget } from './kanbanDnd'

/** Gap key standing for "append to the end of the column". */
const END_GAP = '__end__'

interface DropGapProps {
  insertBeforeJobId?: string
  active: boolean
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
}

/** The thin ordering target between two cards. */
function DropGap({ insertBeforeJobId, active, onDragOver, onDragLeave, onDrop }: DropGapProps) {
  return (
    <div
      aria-hidden="true"
      data-testid="kanban-drop-gap"
      data-insert-before={insertBeforeJobId ?? END_GAP}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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

  const allowDrop = (event: DragEvent<HTMLDivElement>): void => {
    // Preventing default is what marks this element as a valid drop target.
    event.preventDefault()
  }

  const dropAt = (insertBeforeJobId?: string) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    // A gap decides the position; without this the column would append too.
    event.stopPropagation()
    setActiveGap(null)
    const jobId = getDragJobId(event.dataTransfer)
    if (jobId === null) return
    onDropCard(jobId, { status, insertBeforeJobId })
  }

  const dragOverGap = (insertBeforeJobId?: string) => (event: DragEvent<HTMLDivElement>) => {
    allowDrop(event)
    setActiveGap(insertBeforeJobId ?? END_GAP)
  }

  const gap = (insertBeforeJobId?: string) => (
    <DropGap
      insertBeforeJobId={insertBeforeJobId}
      active={activeGap === (insertBeforeJobId ?? END_GAP)}
      onDragOver={dragOverGap(insertBeforeJobId)}
      onDragLeave={() => setActiveGap(null)}
      onDrop={dropAt(insertBeforeJobId)}
    />
  )

  const count = `${cards.length} ${t(
    cards.length === 1 ? 'dashboard.kanban.jobSingular' : 'dashboard.kanban.jobPlural'
  )}`

  return (
    <section
      aria-label={label}
      onDragOver={allowDrop}
      onDrop={dropAt(undefined)}
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
          <p className="py-8 text-center text-xs text-text-muted">{t('dashboard.kanban.empty')}</p>
        ) : (
          <div role="list" aria-label={label} className="flex flex-col">
            {gap(cards[0].job.id)}
            {cards.map((card, index) => (
              <Fragment key={card.job.id}>
                <JobCard card={card} onStatusChange={onStatusChange} />
                {gap(cards[index + 1]?.job.id)}
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
