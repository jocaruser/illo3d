import { useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Combobox, type ComboboxItem } from '@/Component/Combobox'
import { DialogShell } from '@/Component/dialog/DialogShell'
import { FormError } from '@/Component/form/FormError'
import { FormGroup } from '@/Component/form/FormGroup'
import { FormInput } from '@/Component/form/FormInput'
import { FormLabel } from '@/Component/form/FormLabel'
import { RequiredIndicator } from '@/Component/form/RequiredIndicator'
import { toast } from '@/Component/Toast'
import type { Job } from '@/Entity/Job'
import { useEntityManager } from '@/Hook/useEntityManager'
import { useShopMetadata } from '@/Hook/useShopMetadata'
import { JobService } from '@/Service/JobService'

interface CreateJobDialogProps {
  open: boolean
  onClose: () => void
  /** Locks the job to this client and hides the picker. */
  presetClientId?: string
  /** Called with the new job's id after a successful create. */
  onCreated?: (jobId: string) => void
  /** Prefills the form and switches to update mode. */
  job?: Job | null
  /** Called after a successful update. */
  onUpdated?: (job: Job) => void
}

const DAY_MS = 24 * 60 * 60 * 1000

/** `YYYY-MM-DD`, `days` from `from`. */
function isoDayFrom(from: Date, days: number): string {
  return new Date(from.getTime() + days * DAY_MS).toISOString().slice(0, 10)
}

export function CreateJobDialog({
  open,
  onClose,
  presetClientId,
  onCreated,
  job,
  onUpdated,
}: CreateJobDialogProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const { metadata } = useShopMetadata()
  const titleId = useId()
  const dueDateId = useId()
  const isEdit = job !== null && job !== undefined

  const [clientId, setClientId] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')

  const clients = useMemo<ComboboxItem[]>(
    () =>
      open ? em.clients.findActive().map((client) => ({ key: client.id, label: client.name })) : [],
    [em, open]
  )

  // Seed on open: edit mode mirrors the job, create mode prefills the due date
  // `metadata.defaultDueDate` days out (v3 behaviour).
  useEffect(() => {
    if (!open) return
    setError('')
    if (job !== null && job !== undefined) {
      setClientId(job.clientId)
      setDescription(job.description)
      setDueDate(job.dueDate)
      return
    }
    setClientId(presetClientId ?? '')
    setDescription('')
    const days = metadata?.defaultDueDate
    setDueDate(days === undefined ? '' : isoDayFrom(em.clock.now(), days))
  }, [open, job, presetClientId, metadata, em])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const service = new JobService(em)
    const result =
      job !== null && job !== undefined
        ? service.updateJob(job.id, { clientId, description, dueDate })
        : service.createJob({ clientId, description, dueDate })
    if (!result.ok) {
      setError(t(result.error))
      return
    }
    toast.success(t('toast.saveSuccess'))
    if (job !== null && job !== undefined) onUpdated?.(result.job)
    else onCreated?.(result.job.id)
    onClose()
  }

  return (
    <DialogShell open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="font-display text-xl font-semibold text-text">
        {isEdit ? t('jobs.editTitle') : t('jobs.createTitle')}
      </h2>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
        {presetClientId === undefined && (
          <FormGroup>
            <FormLabel>
              {t('jobs.client')} <RequiredIndicator />
            </FormLabel>
            <Combobox
              items={clients}
              value={clientId === '' ? null : clientId}
              placeholder={t('jobs.clientSearchPlaceholder')}
              onChange={setClientId}
            />
          </FormGroup>
        )}

        <FormGroup>
          <FormLabel htmlFor="job-description">
            {t('jobs.description')} <RequiredIndicator />
          </FormLabel>
          <FormInput
            id="job-description"
            value={description}
            placeholder={t('jobs.descriptionPlaceholder')}
            onChange={(event) => setDescription(event.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel htmlFor={dueDateId}>{t('jobs.dueDate')}</FormLabel>
          <FormInput
            id={dueDateId}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </FormGroup>

        <FormError message={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('jobs.cancel')}
          </button>
          <button type="submit" className="btn-primary">
            {isEdit ? t('jobs.save') : t('jobs.submit')}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
