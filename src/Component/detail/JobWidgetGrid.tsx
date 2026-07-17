import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Combobox } from '@/Component/Combobox'
import { cx } from '@/Component/cx'
import { FormInput } from '@/Component/form/FormInput'
import { JOB_STATUSES, type Job, type JobStatus } from '@/Entity/Job'
import { useEntityManager } from '@/Hook/useEntityManager'
import { computeAvgUnitCost } from '@/Service/Pricing/avgUnitCost'
import type { JobPricingState } from '@/Service/Pricing/jobPricing'
import { formatCurrency } from '@/Service/Pricing/money'
import { computeRedos, redoBand, type RedoBand } from '@/Service/Pricing/redos'
import { DetailWidget, WidgetGrid } from './DetailWidget'
import { DueDateBadge, JobTotal } from './JobsTable'

interface JobWidgetGridProps {
  job: Job
  clientName: string
  pricing: JobPricingState
  /** Bumped by the page so the material aggregates recompute. */
  revision?: number
  onStatusChange: (job: Job, next: JobStatus) => void
  onEdit: () => void
  onArchive: () => void
  onSoftDelete: () => void
  onDueDateChange: (dueDate: string) => void
}

const bandClasses: Record<RedoBand, string> = {
  safe: 'text-success',
  tight: 'text-warning',
  risky: 'text-danger',
}

interface MaterialTotals {
  cost: number
  filamentGrams: number
  consumableUnits: number
  /** Tightest redo margin across the job's filament; null when there is none. */
  risk: { redos: number; band: RedoBand; name: string } | null
}

export function JobWidgetGrid({
  job,
  clientName,
  pricing,
  revision = 0,
  onStatusChange,
  onEdit,
  onArchive,
  onSoftDelete,
  onDueDateChange,
}: JobWidgetGridProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [editingDueDate, setEditingDueDate] = useState(false)

  const statusItems = useMemo(
    () => JOB_STATUSES.map((status) => ({ key: status, label: t(`jobs.status.${status}`) })),
    [t]
  )

  const totals = useMemo<MaterialTotals>(() => {
    void revision // the workbook mutates in place; `revision` signals a change
    const need = new Map<string, number>()
    for (const piece of em.pieces.findByJob(job.id)) {
      if (piece.isDeleted()) continue
      const units = piece.hasValidUnits() ? (piece.units as number) : 1
      for (const line of em.pieceItems.findActiveByPiece(piece.id)) {
        if (line.quantity === undefined) continue
        need.set(line.inventoryId, (need.get(line.inventoryId) ?? 0) + line.quantity * units)
      }
    }

    let cost = 0
    let filamentGrams = 0
    let consumableUnits = 0
    let risk: MaterialTotals['risk'] = null
    for (const [inventoryId, quantity] of need) {
      const item = em.inventory.find(inventoryId)
      if (item === null) continue
      const unitCost = computeAvgUnitCost(em.lots.findActiveByInventory(inventoryId))
      if (unitCost !== null) cost += unitCost * quantity
      if (item.type === 'filament') {
        filamentGrams += quantity
        const redo = computeRedos(item.qtyCurrent, quantity)
        if (risk === null || redo.redos < risk.redos) {
          risk = { redos: redo.redos, band: redoBand(redo.redos), name: item.name }
        }
      } else if (item.type === 'consumable') {
        consumableUnits += quantity
      }
    }
    return { cost, filamentGrams, consumableUnits, risk }
  }, [em, job.id, revision])

  const benefit = pricing.complete ? pricing.total - totals.cost : null

  return (
    <WidgetGrid>
      <DetailWidget
        label={t('jobs.widgetId')}
        colSpan={2}
        testId="job-widget-id"
        actions={
          <>
            <button
              type="button"
              className="btn-secondary px-2 py-1 text-xs"
              data-testid="entity-detail-edit"
              onClick={onEdit}
            >
              {t('jobs.editJob')}
            </button>
            <button
              type="button"
              className="btn-secondary px-2 py-1 text-xs"
              data-testid="entity-detail-archive"
              onClick={onArchive}
            >
              {t('lifecycle.archive')}
            </button>
            <button
              type="button"
              className="btn-secondary px-2 py-1 text-xs"
              data-testid="entity-detail-delete"
              onClick={onSoftDelete}
            >
              {t('lifecycle.softDelete')}
            </button>
          </>
        }
      >
        <p className="font-display text-lg font-semibold text-text">
          {job.id} — {job.description}
        </p>
      </DetailWidget>

      <DetailWidget label={t('jobs.widgetStatus')} testId="job-widget-status">
        <div data-testid={`job-status-${job.id}`}>
          <Combobox
            items={statusItems}
            value={job.status}
            placeholder={t('jobs.statusFieldAria', { id: job.id })}
            onChange={(next) => onStatusChange(job, next as JobStatus)}
          />
        </div>
      </DetailWidget>

      <DetailWidget label={t('jobs.widgetTotal')} testId="job-widget-total">
        <JobTotal pricing={pricing} />
      </DetailWidget>

      <DetailWidget label={t('jobs.widgetClient')} testId="job-widget-client">
        <Link
          to={`/clients/${job.clientId}`}
          data-testid={`job-client-link-${job.id}`}
          className="text-primary hover:underline"
        >
          {clientName}
        </Link>
      </DetailWidget>

      <DetailWidget label={t('jobs.widgetDueDate')} testId="job-widget-due-date">
        {editingDueDate ? (
          <FormInput
            type="date"
            autoFocus
            className="px-2 py-1"
            aria-label={t('jobs.dueDateEditAria', { id: job.id })}
            defaultValue={job.dueDate}
            onBlur={(event) => {
              setEditingDueDate(false)
              if (event.target.value !== job.dueDate) onDueDateChange(event.target.value)
            }}
          />
        ) : (
          <button
            type="button"
            data-testid="job-due-date-edit"
            aria-label={t('jobs.dueDateEditAria', { id: job.id })}
            onClick={() => setEditingDueDate(true)}
          >
            <DueDateBadge job={job} clock={em.clock} />
          </button>
        )}
      </DetailWidget>

      <DetailWidget label={t('jobs.widgetBeneficio')} testId="job-widget-beneficio">
        {benefit === null ? (
          <JobTotal pricing={pricing} />
        ) : (
          <span className={cx('tabular-nums', benefit < 0 ? 'text-danger' : 'text-success')}>
            {formatCurrency(benefit)}
          </span>
        )}
      </DetailWidget>

      <DetailWidget label={t('jobs.widgetFilament')} testId="job-widget-filament">
        <span className="tabular-nums">{t('jobs.filamentGrams', { grams: totals.filamentGrams })}</span>
      </DetailWidget>

      <DetailWidget label={t('jobs.widgetConsumibles')} testId="job-widget-consumibles">
        <span className="tabular-nums">
          {t('jobs.consumableUnits', { units: totals.consumableUnits })}
        </span>
      </DetailWidget>

      <DetailWidget label={t('jobs.widgetRiskFactor')} testId="job-widget-risk-factor">
        {totals.risk === null ? (
          <span className="text-text-muted">{t('jobs.riskFactorNone')}</span>
        ) : (
          <span className={bandClasses[totals.risk.band]}>
            {t('jobs.riskFactorValue', { redos: totals.risk.redos, name: totals.risk.name })}
          </span>
        )}
      </DetailWidget>

      <DetailWidget label={t('jobs.widgetMaterialCost')} testId="job-widget-material-cost">
        <span className="tabular-nums text-danger">{formatCurrency(totals.cost)}</span>
      </DetailWidget>
    </WidgetGrid>
  )
}
