import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createJob } from '@/services/job/createJob'
import type { Client } from '@/types/money'

interface CreateJobPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  spreadsheetId: string | null
  clients: Client[]
}

export function CreateJobPopup({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId,
  clients,
}: CreateJobPopupProps) {
  const { t } = useTranslation()
  const [clientQuery, setClientQuery] = useState('')
  const [clientId, setClientId] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
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
    setClientQuery('')
    setClientId('')
    setDescription('')
    setPrice('')
    setError(null)
    setFieldErrors({})
  }, [isOpen])

  const selectedClient = clients.find((c) => c.id === clientId)

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!clientId) errs.client = t('jobs.validation.clientRequired')
    if (!description.trim()) errs.description = t('jobs.validation.required')
    if (price.trim()) {
      const n = parseFloat(price)
      if (Number.isNaN(n) || n < 0) errs.price = t('jobs.validation.priceInvalid')
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate() || !spreadsheetId) return
    setLoading(true)
    try {
      const priceTrim = price.trim()
      await createJob(spreadsheetId, {
        client_id: clientId,
        description: description.trim(),
        price: priceTrim === '' ? undefined : parseFloat(priceTrim),
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          {t('jobs.createTitle')}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="job-client-search"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('jobs.client')}
            </label>
            <input
              id="job-client-search"
              type="text"
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
              placeholder={t('jobs.clientSearchPlaceholder')}
              disabled={loading}
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
            </label>
            <input
              id="job-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('jobs.descriptionPlaceholder')}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.description}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="job-price"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('jobs.priceOptional')}
            </label>
            <input
              id="job-price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={t('jobs.pricePlaceholder')}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {fieldErrors.price && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.price}</p>
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
              {loading ? '...' : t('jobs.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
