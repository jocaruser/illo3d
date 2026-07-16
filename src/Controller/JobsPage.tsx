import { useCallback, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AlertBox } from '@/Component/AlertBox'
import { CreateJobDialog } from '@/Component/detail/CreateJobDialog'
import { JobsTable } from '@/Component/detail/JobsTable'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import { ListTablePageHeader } from '@/Component/layout/ListTablePageHeader'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import { toast } from '@/Component/Toast'
import type { Job } from '@/Entity/Job'
import { useEntityManager } from '@/Hook/useEntityManager'
import { JobStatusFlowDialogs, useJobStatusFlow } from '@/Hook/useJobStatusFlow'
import { LifecycleService } from '@/Service/LifecycleService'
import { jobPricingState } from '@/Service/Pricing/jobPricing'
import { fuzzyFilter } from '@/Service/Search/fuzzyFilter'
import { jobSearchBlob } from '@/Service/Search/searchBlobs'

export function JobsPage() {
  const { t } = useTranslation()
  const em = useEntityManager()
  const navigate = useNavigate()
  const [revision, bump] = useReducer((count: number) => count + 1, 0)
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Job | null>(null)
  const [archiving, setArchiving] = useState<Job | null>(null)

  // Confirming the shared flow commits a status change straight to the
  // workbook, so fold a revision bump into it to recompute the derived rows.
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

  const jobs = useMemo(() => em.jobs.findActive(), [em, revision])

  const clientNames = useMemo(() => {
    const names = new Map<string, string>()
    for (const client of em.clients.findAll()) names.set(client.id, client.name)
    return names
  }, [em, revision])

  const tagNamesByJob = useMemo(() => {
    const names = new Map<string, string[]>()
    for (const link of em.tagLinks.findActive()) {
      if (link.entityType !== 'job') continue
      const tag = em.tags.find(link.tagId)
      if (tag === null || !tag.isActive()) continue
      names.set(link.entityId, [...(names.get(link.entityId) ?? []), tag.name])
    }
    return names
  }, [em, revision])

  const clientName = useCallback(
    (clientId: string) => clientNames.get(clientId) ?? clientId,
    [clientNames]
  )
  const tagNames = useCallback((jobId: string) => tagNamesByJob.get(jobId) ?? [], [tagNamesByJob])
  const pricingOf = useCallback(
    (jobId: string) => jobPricingState(em.pieces.findCountingByJob(jobId)),
    [em, revision]
  )

  const rows = useMemo(
    () =>
      fuzzyFilter(jobs, query, (job) =>
        jobSearchBlob(job, { clientName: clientName(job.clientId), tagNamesLine: tagNames(job.id).join(' ') }, t)
      ),
    [jobs, query, clientName, tagNames, t]
  )

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (job: Job) => {
    setEditing(job)
    setDialogOpen(true)
  }

  const confirmArchive = () => {
    if (archiving === null) return
    new LifecycleService(em).archiveJob(archiving.id)
    toast.success(t('toast.saveSuccess'))
    setArchiving(null)
    bump()
  }

  const emptyMessage = jobs.length === 0 ? t('jobs.empty') : t('listTable.noMatches')

  return (
    <div className="space-y-6">
      <ListTablePageHeader
        title={t('jobs.title')}
        search={
          <ListTableSearchField
            value={query}
            onChange={setQuery}
            placeholder={t('jobs.searchPlaceholder')}
          />
        }
        actions={
          <button
            type="button"
            className="btn-primary"
            data-testid="add-job-button"
            onClick={openCreate}
          >
            {t('jobs.addJob')}
          </button>
        }
      />

      {/* The flow blocks paid/cancelled until every counting piece is priced. */}
      {statusFlow.error !== null && <AlertBox variant="warning">{t(statusFlow.error)}</AlertBox>}

      <JobsTable
        rows={rows}
        clientName={clientName}
        tagNames={tagNames}
        pricingOf={pricingOf}
        emptyMessage={emptyMessage}
        onStatusChange={(job, next) => {
          statusFlow.requestStatusChange(job, next)
          bump()
        }}
        onEdit={openEdit}
        onArchive={setArchiving}
        clock={em.clock}
      />

      <JobStatusFlowDialogs flow={statusFlow} />

      <CreateJobDialog
        open={dialogOpen}
        job={editing}
        onClose={() => setDialogOpen(false)}
        onCreated={(jobId) => void navigate(`/jobs/${jobId}`)}
        onUpdated={bump}
      />

      <ConfirmDialog
        open={archiving !== null}
        title={t('jobs.archiveConfirmTitle')}
        message={t('jobs.archiveConfirmMessage', { id: archiving?.id ?? '' })}
        confirmLabel={t('lifecycle.archive')}
        onConfirm={confirmArchive}
        onCancel={() => setArchiving(null)}
      />
    </div>
  )
}
