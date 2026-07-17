import { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ClientActivityTimeline } from '@/Component/detail/ClientActivityTimeline'
import { ClientJobsTable } from '@/Component/detail/ClientJobsTable'
import { CreateClientDialog } from '@/Component/detail/CreateClientDialog'
import { CreateJobDialog } from '@/Component/detail/CreateJobDialog'
import { EntityDetailPage, type DetailField } from '@/Component/detail/EntityDetailPage'
import { NotesSection } from '@/Component/detail/NotesSection'
import { TagsSection } from '@/Component/detail/TagsSection'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import { MentionLinkify } from '@/Component/MentionLinkify'
import { NotFoundCard } from '@/Component/NotFoundCard'
import { StatCard } from '@/Component/StatCard'
import { toast } from '@/Component/Toast'
import type { Job } from '@/Entity/Job'
import { useEntityManager } from '@/Hook/useEntityManager'
import { LifecycleService } from '@/Service/LifecycleService'
import { computeClientMetrics } from '@/Service/Pricing/clientMetrics'
import { formatCurrency } from '@/Service/Pricing/money'
import { fuzzyFilter } from '@/Service/Search/fuzzyFilter'
import { jobSearchBlob } from '@/Service/Search/searchBlobs'

export function ClientDetailPage() {
  const { t } = useTranslation()
  const em = useEntityManager()
  const navigate = useNavigate()
  const { clientId = '' } = useParams<{ clientId: string }>()

  const [revision, bump] = useReducer((count: number) => count + 1, 0)
  const [query, setQuery] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [jobDialogOpen, setJobDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [archivingJob, setArchivingJob] = useState<Job | null>(null)

  const client = useMemo(() => em.clients.find(clientId), [em, clientId, revision])
  const jobs = useMemo(() => em.jobs.findByClient(clientId), [em, clientId, revision])

  const metrics = useMemo(
    () =>
      computeClientMetrics({
        clientId,
        jobs: em.jobs.findAll(),
        transactions: em.transactions.findAll(),
        pieces: em.pieces.findAll(),
        pieceItems: em.pieceItems.findAll(),
        inventory: em.inventory.findAll(),
        lots: em.lots.findAll(),
      }),
    [em, clientId, revision]
  )

  const jobRows = useMemo(() => {
    const clientName = client?.name ?? ''
    return fuzzyFilter(jobs, query, (job) => jobSearchBlob(job, { clientName }, t))
  }, [jobs, query, client, t])

  if (client === null || client.isDeleted()) {
    return (
      <NotFoundCard
        message={t('clientDetail.notFound')}
        backTo="/clients"
        backLabel={t('clientDetail.backToList')}
      />
    )
  }

  const fields: DetailField[] = [
    { label: t('clients.id'), value: client.id },
    { label: t('clients.email'), value: client.email },
    { label: t('clients.phone'), value: client.phone },
  ]
  if (client.preferredContact !== '') {
    fields.push({ label: t('clients.preferredContact'), value: client.preferredContact })
  }
  if (client.leadSource !== '') {
    fields.push({
      label: t('clients.leadSource'),
      value: (
        <MentionLinkify
          text={client.leadSource}
          resolvePieceJob={(pieceId) => em.pieces.find(pieceId)?.jobId ?? null}
        />
      ),
    })
  }
  if (client.address !== '') {
    fields.push({ label: t('clients.address'), value: client.address })
  }
  fields.push({ label: t('clients.createdAt'), value: client.createdAt })
  if (client.notes !== '') {
    fields.push({ label: t('clientDetail.sheetNoteLabel'), value: client.notes })
  }

  const confirmArchiveClient = () => {
    new LifecycleService(em).archiveClient(client.id)
    toast.success(t('toast.saveSuccess'))
    setArchiveOpen(false)
    void navigate('/clients')
  }

  const confirmArchiveJob = (job: Job) => {
    new LifecycleService(em).archiveJob(job.id)
    toast.success(t('toast.saveSuccess'))
    setArchivingJob(null)
    bump()
  }

  const unarchiveJob = (job: Job) => {
    new LifecycleService(em).restoreJob(job.id)
    toast.success(t('toast.saveSuccess'))
    bump()
  }

  const openJobEdit = (job: Job) => {
    setEditingJob(job)
    setJobDialogOpen(true)
  }

  const openJobCreate = () => {
    setEditingJob(null)
    setJobDialogOpen(true)
  }

  const jobsEmptyMessage = jobs.length === 0 ? t('clientDetail.jobsEmpty') : t('listTable.noMatches')

  return (
    <EntityDetailPage
      backTo="/clients"
      backLabel={t('clientDetail.backToList')}
      title={client.name}
      fields={fields}
      actions={
        <>
          <button
            type="button"
            className="btn-secondary"
            data-testid="entity-detail-edit"
            onClick={() => setEditOpen(true)}
          >
            {t('clients.edit')}
          </button>
          <button
            type="button"
            className="btn-secondary"
            data-testid="entity-detail-archive"
            onClick={() => setArchiveOpen(true)}
          >
            {t('lifecycle.archive')}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" data-testid="client-metrics">
        <StatCard label={t('clientDetail.metricPaidLedger')} value={formatCurrency(metrics.paidLedger)} tone="positive" />
        <StatCard
          label={t('clientDetail.metricOutstanding')}
          value={formatCurrency(metrics.outstandingJobs)}
        />
        <StatCard label={t('clientDetail.metricJobCount')} value={String(metrics.jobCount)} />
        <StatCard
          label={t('clientDetail.metricAvgJobPrice')}
          value={metrics.averageJobPrice === null ? '—' : formatCurrency(metrics.averageJobPrice)}
        />
        <StatCard
          label={t('clientDetail.metricMaterials')}
          value={formatCurrency(metrics.materialsEstimate)}
          tone="negative"
        />
      </div>

      <TagsSection entityType="client" entityId={client.id} />

      <NotesSection entityType="client" entityId={client.id} />

      <ClientActivityTimeline clientId={client.id} revision={revision} />

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SectionHeading>{t('clientDetail.jobsTitle')}</SectionHeading>
          {jobs.length > 0 && (
            <div className="min-w-[12rem] flex-1">
              <ListTableSearchField
                value={query}
                onChange={setQuery}
                placeholder={t('jobs.searchPlaceholder')}
              />
            </div>
          )}
          <button
            type="button"
            className="btn-primary sm:ml-auto"
            data-testid="add-job-button"
            onClick={openJobCreate}
          >
            {t('jobs.addJob')}
          </button>
        </div>

        <ClientJobsTable
          rows={jobRows}
          emptyMessage={jobsEmptyMessage}
          onEdit={openJobEdit}
          onArchive={setArchivingJob}
          onUnarchive={unarchiveJob}
        />
      </section>

      <CreateClientDialog
        open={editOpen}
        client={client}
        onClose={() => setEditOpen(false)}
        onSaved={bump}
      />

      <CreateJobDialog
        open={jobDialogOpen}
        presetClientId={editingJob === null ? client.id : undefined}
        job={editingJob}
        onClose={() => setJobDialogOpen(false)}
        onCreated={bump}
        onUpdated={bump}
      />

      <ConfirmDialog
        open={archiveOpen}
        title={t('clients.archiveConfirmTitle')}
        message={t('clients.archiveConfirmMessage', { name: client.name })}
        confirmLabel={t('lifecycle.archive')}
        onConfirm={confirmArchiveClient}
        onCancel={() => setArchiveOpen(false)}
      />

      {archivingJob !== null && (
        <ConfirmDialog
          open
          title={t('jobs.archiveConfirmTitle')}
          message={t('jobs.archiveConfirmMessage', { id: archivingJob.id })}
          confirmLabel={t('lifecycle.archive')}
          onConfirm={() => confirmArchiveJob(archivingJob)}
          onCancel={() => setArchivingJob(null)}
        />
      )}
    </EntityDetailPage>
  )
}
