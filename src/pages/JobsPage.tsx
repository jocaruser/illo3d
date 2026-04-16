import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { getSheetsRepository } from '@/services/sheets/repository'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { formatTagNameTitleCase } from '@/utils/tagNameFormat'
import { updateJob } from '@/services/job/updateJob'
import { deleteJob } from '@/services/job/deleteJob'
import { JobsTable } from '@/components/JobsTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EmptyState } from '@/components/EmptyState'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Job } from '@/types/money'
import type { UpdateJobPayload } from '@/services/job/updateJob'
import { useJobStatusFlow } from '@/hooks/useJobStatusFlow'

function isActiveJob(j: Job): boolean {
  return j.archived !== 'true' && j.deleted !== 'true'
}

export function JobsPage() {
  const { t } = useTranslation()
  const activeShop = useShopStore((s) => s.activeShop)
  const spreadsheetId = activeShop?.spreadsheetId ?? null
  const workbookStatus = useWorkbookStore((s) => s.status)
  const workbookError = useWorkbookStore((s) => s.error)
  const hydrateWorkbook = useWorkbookStore((s) => s.hydrate)

  const { jobs: allJobs, clients, tags, tagLinks, pieces } = useWorkbookEntities()
  const jobs = useMemo(
    () => allJobs.filter(isActiveJob),
    [allJobs],
  )

  const { tagSearchLineByJobId, tagTitleByJobId } = useMemo(() => {
    const namesByJob = new Map<string, string[]>()
    for (const link of tagLinks) {
      if (link.entity_type !== 'job') continue
      const tag = tags.find((x) => x.id === link.tag_id)
      const label = tag?.name?.trim()
      if (!label) continue
      const list = namesByJob.get(link.entity_id) ?? []
      list.push(formatTagNameTitleCase(label))
      namesByJob.set(link.entity_id, list)
    }
    const search = new Map<string, string>()
    const title = new Map<string, string>()
    for (const [jobId, names] of namesByJob) {
      search.set(jobId, names.join(' '))
      title.set(jobId, names.join(', '))
    }
    return {
      tagSearchLineByJobId: search,
      tagTitleByJobId: title,
    }
  }, [tags, tagLinks])
  const [popupOpen, setPopupOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Job | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const {
    handleStatusSelect,
    statusError,
    statusUpdatingId,
    statusDialogs,
  } = useJobStatusFlow(spreadsheetId)

  const handleRetry = () => {
    if (!spreadsheetId) return
    void hydrateWorkbook(getSheetsRepository(), spreadsheetId)
  }

  const jobPopupOpen = popupOpen || editingJob !== null

  const handleMutationSuccess = async () => {}

  const closeJobPopup = () => {
    setPopupOpen(false)
    setEditingJob(null)
  }

  const handleUpdateJob = async (
    jobId: string,
    payload: UpdateJobPayload
  ) => {
    if (!spreadsheetId) return
    await updateJob(spreadsheetId, jobId, payload)
  }

  const confirmArchiveJob = async () => {
    if (!spreadsheetId || !archiveTarget) return
    setArchiveError(null)
    try {
      await deleteJob(spreadsheetId, archiveTarget.id)
      setArchiveTarget(null)
    } catch {
      setArchiveError(t('errors.deleteFailed'))
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">{t('jobs.title')}</h2>

      <ConnectionStatus
        status={workbookStatus}
        errorMessage={workbookError}
        onRetry={handleRetry}
      />

      {statusError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-red-800">{statusError}</p>
        </div>
      )}

      {workbookStatus === 'ready' && (
        <>
          <div className="mb-4 flex items-center justify-end">
            <button
              type="button"
              data-testid="add-job-button"
              onClick={() => setPopupOpen(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('jobs.addJob')}
            </button>
          </div>

          {jobs.length === 0 ? (
            <EmptyState messageKey="jobs.empty" />
          ) : (
            <JobsTable
              jobs={jobs}
              pieces={pieces}
              clients={clients}
              tagTitleByJobId={tagTitleByJobId}
              tagSearchLineByJobId={tagSearchLineByJobId}
              statusUpdatingId={statusUpdatingId}
              onStatusSelect={(job, next) => {
                void handleStatusSelect(job, next)
              }}
              onEdit={(job) => setEditingJob(job)}
              onArchive={(job) => {
                setArchiveError(null)
                setArchiveTarget(job)
              }}
            />
          )}
        </>
      )}

      <CreateJobPopup
        isOpen={jobPopupOpen}
        onClose={closeJobPopup}
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

      {statusDialogs}
    </div>
  )
}
