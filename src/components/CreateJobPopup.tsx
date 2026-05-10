import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createJob } from '@/services/job/createJob'
import { updateJob } from '@/services/job/updateJob'
import type { Client, Job } from '@/types/money'
import type { UpdateJobPayload } from '@/services/job/updateJob'
import { toast } from '@/lib/toast'
import { DialogShell } from './DialogShell'
import { RequiredIndicator } from './RequiredIndicator'
import { Combobox } from './Combobox'
import { useShopMetadata } from '@/hooks/useShopMetadata'

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0] ?? ''
}

function getDefaultDueDate(defaultDueDateDays: number | string | undefined): string {
  const date = new Date()
  const days = typeof defaultDueDateDays === 'string' ? parseInt(defaultDueDateDays, 10) : defaultDueDateDays
  if (days && days > 0) {
    date.setDate(date.getDate() + days)
  }
  return formatDateForInput(date)
}

interface CreateJobPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newJobId?: string) => void
  spreadsheetId: string | null
  clients: Client[]
  initialJob?: Job | null
  /** When creating (no initialJob), pre-select this client and hide the picker list. */
  presetClientId?: string | null
  onUpdateJob?: (
    jobId: string,
    payload: UpdateJobPayload
  ) => Promise<void>
}

export function CreateJobPopup({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId,
  clients,
  initialJob = null,
  presetClientId = null,
  onUpdateJob,
}: CreateJobPopupProps) {
  const { t } = useTranslation()
  const { data: metadata } = useShopMetadata()
  const [clientId, setClientId] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    if (initialJob) {
      setClientId(initialJob.client_id)
      setDescription(initialJob.description)
      setDueDate(initialJob.due_date ?? '')
    } else if (presetClientId) {
      setClientId(presetClientId)
      setDescription('')
      setDueDate(getDefaultDueDate(metadata?.defaultDueDate))
    } else {
      setClientId('')
      setDescription('')
      setDueDate(getDefaultDueDate(metadata?.defaultDueDate))
    }
    setFieldErrors({})
  }, [isOpen, initialJob, clients, presetClientId, metadata?.defaultDueDate])

  const selectedClient = clients.find((c) => c.id === clientId)

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!clientId) errs.client = t('jobs.validation.clientRequired')
    if (!description.trim()) errs.description = t('jobs.validation.required')
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !spreadsheetId) return
    setLoading(true)
    try {
      if (initialJob) {
        const payload: UpdateJobPayload = {
          client_id: clientId,
          description: description.trim(),
          due_date: dueDate || undefined,
        }
        if (onUpdateJob) {
          await onUpdateJob(initialJob.id, payload)
        } else {
          await updateJob(spreadsheetId, initialJob.id, payload)
        }
        onSuccess()
      } else {
        const newJobId = await createJob(spreadsheetId, {
          client_id: clientId,
          description: description.trim(),
          due_date: dueDate || undefined,
        })
        onSuccess(newJobId)
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('wizard.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const isEdit = initialJob != null
  const isPresetCreate = !isEdit && Boolean(presetClientId)
  const dialogTitle = isEdit ? t('jobs.editTitle') : t('jobs.createTitle')

  return (
    <DialogShell isOpen={isOpen} onClose={onClose} title={dialogTitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor={isPresetCreate ? 'job-client-preset' : 'job-client-search'}
            className="mb-1 block text-sm font-medium text-text"
          >
            {t('jobs.client')}
            <RequiredIndicator />
          </label>
          {isPresetCreate ? (
            <p
              id="job-client-preset"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
            >
              {selectedClient
                ? t('jobs.selectedClient', { name: selectedClient.name })
                : presetClientId}
            </p>
          ) : (
            <Combobox
              items={clients}
              value={clientId}
              onChange={(key) => setClientId(key)}
              getKey={(c) => c.id}
              getLabel={(c) => c.name}
              disabled={loading}
              id="job-client-search"
              placeholder={t('jobs.clientSearchPlaceholder')}
              searchable
            />
          )}
          {fieldErrors.client && (
            <p className="mt-1 text-sm text-danger">{fieldErrors.client}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="job-description"
            className="mb-1 block text-sm font-medium text-text"
          >
            {t('jobs.description')}
            <RequiredIndicator />
          </label>
          <input
            id="job-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('jobs.descriptionPlaceholder')}
            disabled={loading}
            aria-required="true"
            className="w-full rounded-lg border border-border px-3 py-2 text-text focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 dark:bg-gray-800"
          />
          {fieldErrors.description && (
            <p className="mt-1 text-sm text-danger">
              {fieldErrors.description}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="job-due-date"
            className="mb-1 block text-sm font-medium text-text"
          >
            {t('jobs.dueDate', 'Due date')}
          </label>
          <input
            id="job-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-border px-3 py-2 text-text focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-100 dark:bg-gray-800"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-text hover:bg-surface disabled:opacity-50"
          >
            {t('jobs.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? t('common.submitting')
              : isEdit
                ? t('jobs.save')
                : t('jobs.submit')}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
