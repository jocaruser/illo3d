import { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ClientActivityTimeline } from '@/Component/detail/ClientActivityTimeline'
import { ClientJobsTable } from '@/Component/detail/ClientJobsTable'
import { CreateClientDialog } from '@/Component/detail/CreateClientDialog'
import { CreateJobDialog } from '@/Component/detail/CreateJobDialog'
import {
  ArchivedEntityNotice,
  EntityDetailPage,
  type DetailField,
} from '@/Component/detail/EntityDetailPage'
import { NotesSection } from '@/Component/detail/NotesSection'
import { TagsSection } from '@/Component/detail/TagsSection'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import { MentionLinkify } from '@/Component/MentionLinkify'
import { NotFoundCard } from '@/Component/NotFoundCard'
import { StatCard } from '@/Component/StatCard'
import { toast } from '@/Component/Toast'
import type { Client } from '@/Entity/Client'
import type { Job } from '@/Entity/Job'
import { useEntityManager } from '@/Hook/useEntityManager'
import type { EntityManager } from '@/Repository/EntityManager'
import { LifecycleService } from '@/Service/LifecycleService'
import { computeClientMetrics } from '@/Service/Pricing/clientMetrics'
import { formatCurrency } from '@/Service/Pricing/money'
import { fuzzyFilter } from '@/Service/Search/fuzzyFilter'
import { jobSearchBlob } from '@/Service/Search/searchBlobs'

type LifecycleAction = 'archive' | 'delete'

type Translate = ReturnType<typeof useTranslation>['t']

/** The recorded fields — shown only when filled. */
function clientFields(
  client: Client,
  em: EntityManager,
  t: Translate
): DetailField[] {
  const fields: DetailField[] = [{ label: t('clients.id'), value: client.id }]
  if (client.email !== '') {
    fields.push({ label: t('clients.email'), value: client.email })
  }
  if (client.phone !== '') {
    fields.push({ label: t('clients.phone'), value: client.phone })
  }
  if (client.preferredContact !== '') {
    fields.push({
      label: t('clients.preferredContact'),
      value: client.preferredContact,
    })
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
    fields.push({
      label: t('clientDetail.sheetNoteLabel'),
      value: client.notes,
    })
  }
  return fields
}

export function ClientDetailPage() {
  const { t } = useTranslation()
  const em = useEntityManager()
  const navigate = useNavigate()
  const { clientId = '' } = useParams<{ clientId: string }>()

  const [revision, bump] = useReducer((count: number) => count + 1, 0)
  const [query, setQuery] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [lifecycle, setLifecycle] = useState<LifecycleAction | null>(null)
  // One value covers the whole job-dialog session: null is closed, `editing:
  // null` is create mode, and a job is edit mode.
  const [jobDialog, setJobDialog] = useState<{ editing: Job | null } | null>(
    null
  )
  const [archivingJob, setArchivingJob] = useState<Job | null>(null)

  const client = useMemo(() => {
    void revision // the workbook mutates in place; `revision` signals a change
    return em.clients.find(clientId)
  }, [em, clientId, revision])
  const jobs = useMemo(() => {
    void revision // the workbook mutates in place; `revision` signals a change
    return em.jobs.findByClient(clientId)
  }, [em, clientId, revision])

  const metrics = useMemo(() => {
    void revision // the workbook mutates in place; `revision` signals a change
    return computeClientMetrics({
      clientId,
      jobs: em.jobs.findAll(),
      transactions: em.transactions.findAll(),
      pieces: em.pieces.findAll(),
      pieceItems: em.pieceItems.findAll(),
      inventory: em.inventory.findAll(),
      lots: em.lots.findAll(),
    })
  }, [em, clientId, revision])

  const jobRows = useMemo(() => {
    const clientName = client?.name ?? ''
    return fuzzyFilter(jobs, query, (job) =>
      jobSearchBlob(job, { clientName }, t)
    )
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

  // Active → Edit + Archive; archived → read-only with Un-archive + Soft
  // delete; soft-deleted → not found above.
  const archived = client.isArchived()

  const confirmLifecycle = () => {
    const service = new LifecycleService(em)
    if (lifecycle === 'delete') service.softDeleteClient(client.id)
    else service.archiveClient(client.id)
    toast.success(t('toast.changeApplied'))
    setLifecycle(null)
    void navigate('/clients')
  }

  const unarchiveClient = () => {
    new LifecycleService(em).restoreClient(client.id)
    toast.success(t('toast.changeApplied'))
    bump()
  }

  const confirmArchiveJob = (job: Job) => {
    new LifecycleService(em).archiveJob(job.id)
    toast.success(t('toast.changeApplied'))
    setArchivingJob(null)
    bump()
  }

  const unarchiveJob = (job: Job) => {
    new LifecycleService(em).restoreJob(job.id)
    toast.success(t('toast.changeApplied'))
    bump()
  }

  const openJobEdit = (job: Job) => setJobDialog({ editing: job })

  const openJobCreate = () => setJobDialog({ editing: null })

  const editingJob = jobDialog?.editing ?? null

  const jobsEmptyMessage =
    jobs.length === 0 ? t('clientDetail.jobsEmpty') : t('listTable.noMatches')

  return (
    <EntityDetailPage
      backTo="/clients"
      backLabel={t('clientDetail.backToList')}
      title={client.name}
      fields={clientFields(client, em, t)}
      banner={archived ? <ArchivedEntityNotice /> : undefined}
      actions={
        archived ? (
          <>
            <button
              type="button"
              className="btn-secondary"
              data-testid="entity-detail-unarchive"
              onClick={unarchiveClient}
            >
              {t('lifecycle.unarchive')}
            </button>
            <button
              type="button"
              className="btn-secondary"
              data-testid="entity-detail-delete"
              onClick={() => setLifecycle('delete')}
            >
              {t('lifecycle.softDelete')}
            </button>
          </>
        ) : (
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
              onClick={() => setLifecycle('archive')}
            >
              {t('lifecycle.archive')}
            </button>
          </>
        )
      }
    >
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-5"
        data-testid="client-metrics"
      >
        <StatCard
          label={t('clientDetail.metricPaidLedger')}
          value={formatCurrency(metrics.paidLedger)}
          tone="positive"
        />
        <StatCard
          label={t('clientDetail.metricOutstanding')}
          value={formatCurrency(metrics.outstandingJobs)}
        />
        <StatCard
          label={t('clientDetail.metricJobCount')}
          value={String(metrics.jobCount)}
        />
        <StatCard
          label={t('clientDetail.metricAvgJobPrice')}
          value={
            metrics.averageJobPrice === null
              ? '—'
              : formatCurrency(metrics.averageJobPrice)
          }
        />
        <StatCard
          label={t('clientDetail.metricMaterials')}
          value={formatCurrency(metrics.materialsEstimate)}
          tone="negative"
        />
      </div>

      <TagsSection
        entityType="client"
        entityId={client.id}
        readOnly={archived}
      />

      <NotesSection
        entityType="client"
        entityId={client.id}
        readOnly={archived}
      />

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
          {!archived && (
            <button
              type="button"
              className="btn-primary sm:ml-auto"
              data-testid="add-job-button"
              onClick={openJobCreate}
            >
              {t('jobs.addJob')}
            </button>
          )}
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
        open={jobDialog !== null}
        presetClientId={editingJob === null ? client.id : undefined}
        job={editingJob}
        onClose={() => setJobDialog(null)}
        onCreated={bump}
        onUpdated={bump}
      />

      <ConfirmDialog
        open={lifecycle !== null}
        title={
          lifecycle === 'delete'
            ? t('clients.deleteConfirmTitle')
            : t('clients.archiveConfirmTitle')
        }
        message={
          lifecycle === 'delete'
            ? t('clients.deleteConfirmMessage', { name: client.name })
            : t('clients.archiveConfirmMessage', { name: client.name })
        }
        confirmLabel={
          lifecycle === 'delete'
            ? t('lifecycle.softDelete')
            : t('lifecycle.archive')
        }
        onConfirm={confirmLifecycle}
        onCancel={() => setLifecycle(null)}
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
