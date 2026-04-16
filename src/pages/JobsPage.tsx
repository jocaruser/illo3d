import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useShopStore } from '@/stores/shopStore'
import { useWorkbookStore } from '@/stores/workbookStore'
import { getSheetsRepository } from '@/services/sheets/repository'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { formatTagNameTitleCase } from '@/utils/tagNameFormat'
import { updateJobStatus } from '@/services/job/updateJobStatus'
import { updateJob } from '@/services/job/updateJob'
import { deleteJob } from '@/services/job/deleteJob'
import { JobsTable } from '@/components/JobsTable'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EmptyState } from '@/components/EmptyState'
import { CreateJobPopup } from '@/components/CreateJobPopup'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Job, JobStatus } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import type { UpdateJobPayload } from '@/services/job/updateJob'

function jobHasPrice(job: Job): boolean {
  return (
    job.price !== undefined &&
    job.price !== null &&
    !Number.isNaN(Number(job.price))
  )
}

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

  const { jobs: allJobs, clients, tags, tagLinks } = useWorkbookEntities()
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
  const [cancelDialogJob, setCancelDialogJob] = useState<Job | null>(null)
  const [paidDialogJob, setPaidDialogJob] = useState<Job | null>(null)
  const [paidPriceInput, setPaidPriceInput] = useState('')
  const [paidCreateTransaction, setPaidCreateTransaction] = useState(true)
  const [leavePaidPending, setLeavePaidPending] = useState<{
    job: Job
    next: JobStatus
  } | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const handleRetry = () => {
    if (!spreadsheetId) return
    void hydrateWorkbook(getSheetsRepository(), spreadsheetId)
  }

  const commitStatus = async (
    job: Job,
    next: JobStatus,
    options?: { paidPrice?: number; createIncomeTransaction?: boolean }
  ) => {
    if (!spreadsheetId) return
    setStatusUpdatingId(job.id)
    setStatusError(null)
    try {
      await updateJobStatus(spreadsheetId, job, next, options)
    } catch {
      setStatusError(t('errors.actionFailed'))
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleStatusSelect = async (job: Job, next: JobStatus) => {
    if (next === job.status) return
    if (next === 'paid') {
      setPaidPriceInput('')
      setPaidCreateTransaction(true)
      setPaidDialogJob(job)
      return
    }
    if (job.status === 'paid') {
      setLeavePaidPending({ job, next })
      return
    }
    if (next === 'cancelled') {
      setCancelDialogJob(job)
      return
    }
    await commitStatus(job, next)
  }

  const paidConfirmDisabled = (): boolean => {
    if (!paidDialogJob) return true
    if (jobHasPrice(paidDialogJob)) return false
    const n = parseFloat(paidPriceInput)
    return Number.isNaN(n) || n < 0
  }

  const confirmPaid = async () => {
    if (!paidDialogJob) return
    if (!jobHasPrice(paidDialogJob) && paidConfirmDisabled()) return
    const options: {
      paidPrice?: number
      createIncomeTransaction: boolean
    } = {
      createIncomeTransaction: paidCreateTransaction,
    }
    if (!jobHasPrice(paidDialogJob)) {
      options.paidPrice = parseFloat(paidPriceInput)
    }
    await commitStatus(paidDialogJob, 'paid', options)
    setPaidDialogJob(null)
    setPaidPriceInput('')
    setPaidCreateTransaction(true)
  }

  const confirmCancelled = async () => {
    if (!cancelDialogJob) return
    await commitStatus(cancelDialogJob, 'cancelled')
    setCancelDialogJob(null)
  }

  const confirmLeavePaid = async () => {
    if (!leavePaidPending) return
    await commitStatus(leavePaidPending.job, leavePaidPending.next)
    setLeavePaidPending(null)
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

      <ConfirmDialog
        isOpen={!!paidDialogJob}
        title={t('jobs.confirmPaidTitle')}
        message={
          paidDialogJob && jobHasPrice(paidDialogJob)
            ? t('jobs.confirmPaidWithPrice', {
                price: formatCurrency(paidDialogJob.price!),
              })
            : t('jobs.confirmPaidNeedPrice')
        }
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        confirmDisabled={paidConfirmDisabled()}
        onCancel={() => {
          setPaidDialogJob(null)
          setPaidPriceInput('')
          setPaidCreateTransaction(true)
        }}
        onConfirm={() => {
          void confirmPaid()
        }}
      >
               {paidDialogJob && !jobHasPrice(paidDialogJob) ? (
          <div className="mb-2">
            <label
              htmlFor="paid-price-input"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('jobs.paidPriceLabel')}
            </label>
            <input
              id="paid-price-input"
              type="number"
              step="0.01"
              min="0"
              value={paidPriceInput}
              onChange={(e) => setPaidPriceInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ) : null}
        {paidDialogJob ? (
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={paidCreateTransaction}
              onChange={(e) => setPaidCreateTransaction(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{t('jobs.paidCreateTransactionLabel')}</span>
          </label>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!cancelDialogJob}
        title={t('jobs.confirmCancelTitle')}
        message={t('jobs.confirmCancelMessage')}
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => setCancelDialogJob(null)}
        onConfirm={() => {
          void confirmCancelled()
        }}
      />

      <ConfirmDialog
        isOpen={!!leavePaidPending}
        title={t('jobs.confirmLeavePaidTitle')}
        message={t('jobs.confirmLeavePaidMessage', {
          status: leavePaidPending
            ? t(`jobs.status.${leavePaidPending.next}`)
            : '',
        })}
        confirmLabel={t('jobs.confirm')}
        cancelLabel={t('jobs.cancel')}
        onCancel={() => setLeavePaidPending(null)}
        onConfirm={() => {
          void confirmLeavePaid()
        }}
      />
    </div>
  )
}
