import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createJob } from '@/services/job/createJob'
import { updateJob } from '@/services/job/updateJob'
import type { Client, Job } from '@/types/money'
import type { UpdateJobPayload } from '@/services/job/updateJob'
import { DialogShell } from './DialogShell'
import { RequiredIndicator } from './RequiredIndicator'

interface CreateJobPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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
  const [clientQuery, setClientQuery] = useState('')
  const [clientId, setClientId] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) => c.name.toLowerCase().includes(q))
  }, [clients, clientQuery])

  useEffect(() => {
    if (!isOpen) return
    if (initialJob) {
      const c = clients.find((x) => x.id === initialJob.client_id)
      setClientQuery(c?.name ?? '')
      setClientId(initialJob.client_id)
      setDescription(initialJob.description)
    } else if (presetClientId) {
      const c = clients.find((x) => x.id === presetClientId)
      setClientId(presetClientId)
      setClientQuery(c?.name ?? '')
      setDescription('')
    } else {
      setClientQuery('')
      setClientId('')
      setDescription('')
    }
    setError(null)
    setFieldErrors({})
  }, [isOpen, initialJob, clients, presetClientId])

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
    setError(null)
    if (!validate() || !spreadsheetId) return
    setLoading(true)
    try {
      if (initialJob) {
        const payload: UpdateJobPayload = {
          client_id: clientId,
          description: description.trim(),
        }
        if (onUpdateJob) {
          await onUpdateJob(initialJob.id, payload)
        } else {
          await updateJob(spreadsheetId, initialJob.id, payload)
        }
      } else {
        await createJob(spreadsheetId, {
          client_id: clientId,
          description: description.trim(),
        })
      }
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
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
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('jobs.client')}
            <RequiredIndicator />
          </label>
          {isPresetCreate ? (
            <p
              id="job-client-preset"
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800"
            >
              {selectedClient
                ? t('jobs.selectedClient', { name: selectedClient.name })
                : presetClientId}
            </p>
          ) : (
            <>
              <input
                id="job-client-search"
                type="text"
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                placeholder={t('jobs.clientSearchPlaceholder')}
                disabled={loading}
                aria-required="true"
                className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {selectedClient && (
                <p className="mb-2 text-sm text-gray-600">
                  {t('jobs.selectedClient', { name: selectedClient.name })}
                </p>
              )}
              <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-200">
                {filteredClients.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">
                    {t('jobs.noClientsMatch')}
                  </p>
                ) : (
                  filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClientId(c.id)
                        setClientQuery(c.name)
                      }}
                      disabled={loading}
                      className={`flex w-full px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:bg-gray-100 ${
                        clientId === c.id ? 'bg-blue-50 font-medium' : ''
                      }`}
                    >
                      {c.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
          {fieldErrors.client && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.client}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="job-description"
            className="mb-1 block text-sm font-medium text-gray-700"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          {fieldErrors.description && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.description}
            </p>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
