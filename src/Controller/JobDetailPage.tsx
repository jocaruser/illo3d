import { useMemo, useReducer, useState } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertBox } from '@/Component/AlertBox'
import { CreateJobDialog } from '@/Component/detail/CreateJobDialog'
import { CreatePieceDialog } from '@/Component/detail/CreatePieceDialog'
import { ArchivedEntityNotice } from '@/Component/detail/EntityDetailPage'
import { JobMaterialsSummary } from '@/Component/detail/JobMaterialsSummary'
import { JobWidgetGrid } from '@/Component/detail/JobWidgetGrid'
import { NotesSection } from '@/Component/detail/NotesSection'
import { PiecesTable } from '@/Component/detail/PiecesTable'
import { TagsSection } from '@/Component/detail/TagsSection'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import { JobStatusFlowDialogs } from '@/Component/dialog/JobStatusFlowDialogs'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import { NotFoundCard } from '@/Component/NotFoundCard'
import { toast } from '@/Component/Toast'
import { useEntityManager } from '@/Hook/useEntityManager'
import { useJobStatusFlow } from '@/Hook/useJobStatusFlow'
import { JobService } from '@/Service/JobService'
import { LifecycleService } from '@/Service/LifecycleService'
import { jobPricingState } from '@/Service/Pricing/jobPricing'
import { fuzzyFilter } from '@/Service/Search/fuzzyFilter'
import { pieceSearchBlob } from '@/Service/Search/searchBlobs'

type LifecycleAction = 'archive' | 'delete'

export function JobDetailPage() {
  const { t } = useTranslation()
  const em = useEntityManager()
  const navigate = useNavigate()
  const { jobId = '' } = useParams<{ jobId: string }>()

  const [revision, bump] = useReducer((count: number) => count + 1, 0)
  const [query, setQuery] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [pieceDialogOpen, setPieceDialogOpen] = useState(false)
  const [lifecycle, setLifecycle] = useState<LifecycleAction | null>(null)

  // Confirming the shared flow writes straight to the workbook, so fold a
  // revision bump into it to refresh the widgets.
  const flow = useJobStatusFlow()
  const statusFlow = useMemo(
    () => ({
      ...flow,
      confirm: () => {
        flow.confirm()
        bump()
      },
    }),
    [flow]
  )

  const job = useMemo(() => {
    void revision // the workbook mutates in place; `revision` signals a change
    return em.jobs.find(jobId)
  }, [em, jobId, revision])
  // Children are history: archived and soft-deleted pieces stay listed.
  const pieces = useMemo(() => {
    void revision // the workbook mutates in place; `revision` signals a change
    return em.pieces.findByJob(jobId)
  }, [em, jobId, revision])
  const pricing = useMemo(() => {
    void revision // the workbook mutates in place; `revision` signals a change
    return jobPricingState(em.pieces.findCountingByJob(jobId))
  }, [em, jobId, revision])
  const clientName = useMemo(() => {
    if (job === null) return ''
    return em.clients.find(job.clientId)?.name ?? job.clientId
  }, [em, job])

  const pieceRows = useMemo(() => {
    const jobLabel = job === null ? '' : job.description
    return fuzzyFilter(pieces, query, (piece) =>
      pieceSearchBlob(piece, { jobLabel }, t)
    )
  }, [pieces, query, job, t])

  if (job === null || job.isDeleted()) {
    return (
      <NotFoundCard
        message={t('jobs.jobNotFound')}
        backTo="/jobs"
        backLabel={t('jobs.backToList')}
      />
    )
  }

  // Active → Edit + Archive; archived → read-only with Un-archive + Soft
  // delete; soft-deleted → not found above.
  const archived = job.isArchived()

  const confirmLifecycle = () => {
    const service = new LifecycleService(em)
    if (lifecycle === 'delete') service.softDeleteJob(job.id)
    else service.archiveJob(job.id)
    toast.success(t('toast.changeApplied'))
    setLifecycle(null)
    void navigate('/jobs')
  }

  const unarchive = () => {
    new LifecycleService(em).restoreJob(job.id)
    toast.success(t('toast.changeApplied'))
    bump()
  }

  const changeDueDate = (dueDate: string) => {
    const result = new JobService(em).updateJob(job.id, {
      clientId: job.clientId,
      description: job.description,
      dueDate,
    })
    if (!result.ok) {
      toast.error(t(result.error))
      return
    }
    toast.success(t('toast.changeApplied'))
    bump()
  }

  const piecesEmptyMessage =
    pieces.length === 0 ? t('pieces.empty') : t('listTable.noMatches')

  return (
    <div className="space-y-6">
      <Link
        to="/jobs"
        data-testid="entity-detail-back"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text hover:underline"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {t('jobs.backToList')}
      </Link>

      {archived && <ArchivedEntityNotice />}

      <JobWidgetGrid
        job={job}
        clientName={clientName}
        pricing={pricing}
        revision={revision}
        onStatusChange={(target, next) => {
          statusFlow.requestStatusChange(target, next)
          bump()
        }}
        onEdit={() => setEditOpen(true)}
        onArchive={() => setLifecycle('archive')}
        onUnarchive={unarchive}
        onSoftDelete={() => setLifecycle('delete')}
        onDueDateChange={changeDueDate}
      />

      {/* The flow blocks paid/cancelled until every counting piece is priced. */}
      {statusFlow.error !== null && (
        <AlertBox variant="warning">{t(statusFlow.error)}</AlertBox>
      )}

      <JobStatusFlowDialogs flow={statusFlow} />

      <JobMaterialsSummary jobId={job.id} revision={revision} />

      <TagsSection entityType="job" entityId={job.id} readOnly={archived} />

      <NotesSection entityType="job" entityId={job.id} readOnly={archived} />

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SectionHeading>{t('pieces.title')}</SectionHeading>
          <div className="min-w-[12rem] flex-1">
            <ListTableSearchField
              value={query}
              onChange={setQuery}
              placeholder={t('pieces.searchPlaceholder')}
            />
          </div>
          {!archived && (
            <button
              type="button"
              className="btn-primary sm:ml-auto"
              data-testid="add-piece-button"
              onClick={() => setPieceDialogOpen(true)}
            >
              {t('pieces.addPiece')}
            </button>
          )}
        </div>

        <PiecesTable
          rows={pieceRows}
          emptyMessage={piecesEmptyMessage}
          readOnly={archived}
          onChanged={bump}
        />
      </section>

      <CreateJobDialog
        open={editOpen}
        job={job}
        onClose={() => setEditOpen(false)}
        onUpdated={bump}
      />

      <CreatePieceDialog
        open={pieceDialogOpen}
        jobId={job.id}
        onClose={() => setPieceDialogOpen(false)}
        onCreated={bump}
      />

      <ConfirmDialog
        open={lifecycle !== null}
        title={
          lifecycle === 'delete'
            ? t('jobs.confirmDeleteTitle')
            : t('jobs.archiveConfirmTitle')
        }
        message={
          lifecycle === 'delete'
            ? t('jobs.confirmDeleteMessage', { id: job.id })
            : t('jobs.archiveConfirmMessage', { id: job.id })
        }
        confirmLabel={
          lifecycle === 'delete'
            ? t('lifecycle.softDelete')
            : t('lifecycle.archive')
        }
        onConfirm={confirmLifecycle}
        onCancel={() => setLifecycle(null)}
      />
    </div>
  )
}
