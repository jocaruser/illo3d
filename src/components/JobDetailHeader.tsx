import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Client, Job, Piece } from '@/types/money'
import { Combobox } from './Combobox'
import { JobWidget } from './JobWidget'
import { JobWidgetGrid } from './JobWidgetGrid'
import { JobPricingTotalDisplay } from './JobPricingTotalDisplay'
import { ColoredNumber } from './ColoredNumber'
import { CreateJobPopup } from './CreateJobPopup'
import { ConfirmDialog } from './ConfirmDialog'
import { updateJob } from '@/services/job/updateJob'
import type { UpdateJobPayload } from '@/services/job/updateJob'
import { deleteJob } from '@/services/job/deleteJob'
import { jobPricingState } from '@/utils/jobPiecePricing'
import { jobDueDateGradient } from '@/utils/jobDueDateGradient'
import { jobOverallRiskFactor } from '@/utils/jobOverallRiskFactor'
import { formatCurrency } from '@/utils/money'

interface JobDetailHeaderProps {
  job: Job
  clients: Client[]
  allPieces: Piece[]
  jobPricing: ReturnType<typeof jobPricingState>
  materialCost: number
  dueDate: ReturnType<typeof jobDueDateGradient> | null
  filamentGrams: number
  consumableUnits: number
  overallRiskFactor: ReturnType<typeof jobOverallRiskFactor>
  spreadsheetId: string | null
  jobStatusUpdatingId: string | null
  onStatusChange: (job: Job, status: Job['status']) => void
}

export function JobDetailHeader({
  job,
  clients,
  allPieces,
  jobPricing,
  materialCost,
  dueDate,
  filamentGrams,
  consumableUnits,
  overallRiskFactor,
  spreadsheetId,
  jobStatusUpdatingId,
  onStatusChange,
}: JobDetailHeaderProps) {
  const clientName = clients.find((c) => c.id === job.client_id)?.name ?? job.client_id
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Job | null>(null)
  const [archiveError, setArchiveError] = useState<string | null>(null)

  const handleUpdateJob = async (
    jobIdParam: string,
    payload: UpdateJobPayload
  ) => {
    if (!spreadsheetId) return
    await updateJob(spreadsheetId, jobIdParam, payload)
  }

  const confirmArchiveJob = async () => {
    if (!spreadsheetId || !archiveTarget) return
    setArchiveError(null)
    try {
      await deleteJob(spreadsheetId, archiveTarget.id)
      setArchiveTarget(null)
      navigate('/jobs')
    } catch {
      setArchiveError(t('errors.deleteFailed'))
    }
  }

  const widgets = [
    {
      label: t('jobs.widgetId'),
      value: (
        <div className="flex items-center justify-between gap-2">
          <span>{`${job.id} — ${job.description}`}</span>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              data-testid="entity-detail-edit"
              onClick={() => setEditingJob(job)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-surface"
            >
              {t('jobs.editJob')}
            </button>
            <button
              type="button"
              data-testid="entity-detail-delete"
              onClick={() => {
                setArchiveError(null)
                setArchiveTarget(job)
              }}
              className="rounded-lg border border-red-200 dark:border-red-800 bg-surface-elevated px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:bg-red-950"
            >
              {t('lifecycle.archive')}
            </button>
          </div>
        </div>
      ),
      colSpan: 2 as const,
    },
    {
      label: t('jobs.widgetStatus'),
      value: (
        <Combobox
          items={['draft', 'in_progress', 'delivered', 'paid', 'cancelled'] as const}
          value={job.status}
          onChange={(key) => {
            void onStatusChange(job, key as Job['status'])
          }}
          getKey={(s) => s}
          getLabel={(s) => t(`jobs.status.${s}`)}
          disabled={jobStatusUpdatingId === job.id}
          searchable={false}
        />
      ),
    },
    {
      label: t('jobs.widgetTotal'),
      value: (
        <JobPricingTotalDisplay
          jobId={job.id}
          pieces={allPieces}
          t={t}
        />
      ),
      alignRight: true,
    },
    {
      label: t('jobs.widgetClient'),
      value: (
        <Link
          to={`/clients/${job.client_id}`}
          className="text-primary hover:text-blue-800 dark:text-blue-200"
        >
          {clientName}
        </Link>
      ),
      colSpan: 2 as const,
    },
    {
      label: t('jobs.widgetDueDate'),
      value: dueDate?.label ?? '—',
      bgClass: dueDate?.bgClass,
      textClass: dueDate?.textClass,
    },
    {
      label: t('jobs.widgetBeneficio'),
      value:
        jobPricing.kind === 'complete'
          ? (
            <ColoredNumber
              value={jobPricing.total - materialCost}
              formatter={formatCurrency}
            />
          )
          : (
            <span className="inline-flex items-center rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 font-semibold text-amber-900 dark:text-amber-200 text-sm">
              {t('jobs.totalIncomplete')}
            </span>
          ),
      alignRight: true,
    },
    {
      label: t('jobs.widgetFilament'),
      value: `${filamentGrams}g`,
    },
    {
      label: t('jobs.widgetConsumibles'),
      value: `${consumableUnits} ${t('jobs.materialsUnits')}`,
    },
    {
      label: t('jobs.widgetRiskFactor'),
      value: overallRiskFactor
        ? (() => {
            const { minRedos, inventoryName } = overallRiskFactor
            const colorClass =
              minRedos >= 2
                ? 'text-success'
                : minRedos === 1
                  ? 'text-accent'
                  : 'text-danger'
            return (
              <span className={colorClass}>
                {t('jobs.riskFactorValue', { redos: minRedos, name: inventoryName })}
              </span>
            )
          })()
        : '—',
      testId: 'job-widget-risk-factor',
    },
    {
      label: t('jobs.widgetMaterialCost'),
      value: <ColoredNumber value={materialCost} formatter={formatCurrency} forceRed />,
      alignRight: true,
      testId: 'job-widget-material-cost',
    },
  ]

  return (
    <>
      <div className="mb-8">
        <JobWidgetGrid>
          {widgets.map((w) => (
            <JobWidget
              key={w.label}
              label={w.label}
              value={w.value}
              bgClass={w.bgClass}
              textClass={w.textClass}
              colSpan={w.colSpan}
              alignRight={w.alignRight}
              testId={w.testId}
            />
          ))}
        </JobWidgetGrid>
      </div>

      <CreateJobPopup
        isOpen={editingJob !== null}
        onClose={() => setEditingJob(null)}
        onSuccess={() => {}}
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
          <p className="text-sm text-danger">{archiveError}</p>
        ) : null}
      </ConfirmDialog>
    </>
  )
}
