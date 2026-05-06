import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { formatTagNameTitleCase } from '@/utils/tagNameFormat'
import { updateJob } from '@/services/job/updateJob'
import { deleteJob } from '@/services/job/deleteJob'
import { JobsTable } from '@/components/JobsTable'
import { ListTablePageHeader } from '@/components/list-table/ListTablePageHeader'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Job } from '@/types/money'
import type { UpdateJobPayload } from '@/services/job/updateJob'
import { useJobStatusFlow } from '@/hooks/useJobStatusFlow'
import { isActiveRow } from '@/lib/entityFilters'

export function JobsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    spreadsheetId,
    workbookStatus,
  } = useWorkbookConnection()

  const { jobs: allJobs, clients, tags, tagLinks, pieces } = useWorkbookEntities()
  const jobs = useMemo(
    () => allJobs.filter(isActiveRow),
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
  const [query, setQuery] = useState('')
  const {
    handleStatusSelect,
    statusError,
    statusUpdatingId,
    statusDialogs,
  } = useJobStatusFlow(spreadsheetId)

  const jobPopupOpen = popupOpen || editingJob !== null

  const handleMutationSuccess = async (newJobId?: string) => {
    if (newJobId) {
      navigate(`/jobs/${newJobId}`)
    }
  }

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
    <div className="mx-auto max-w-7xl px-4 py-8" aria-busy={workbookStatus !== 'ready'}>
      {statusError && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">{statusError}</p>
        </div>
      )}

      {workbookStatus === 'ready' && (
        <>
          <ListTablePageHeader
            title={t('jobs.title')}
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
                data-testid="add-job-button"
                onClick={() => {
                  setQuery('')
                  setPopupOpen(true)
                }}
                className="btn-primary"
              >
                {t('jobs.addJob')}
              </button>
            }
          />

          <JobsTable
            jobs={jobs}
            query={query}
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
          <p className="text-sm text-red-600 dark:text-red-400">{archiveError}</p>
        ) : null}
      </ConfirmDialog>

      {statusDialogs}
    </div>
  )
}
