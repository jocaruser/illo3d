import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/services/client/createClient'
import { updateClient } from '@/services/client/updateClient'
import type { Client } from '@/types/money'
import type { UpdateClientPayload } from '@/services/client/updateClient'

interface CreateClientPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  spreadsheetId: string | null
  initialClient?: Client | null
  onUpdateClient?: (
    clientId: string,
    payload: UpdateClientPayload
  ) => Promise<void>
}

export function CreateClientPopup({
  isOpen,
  onClose,
  onSuccess,
  spreadsheetId,
  initialClient = null,
  onUpdateClient,
}: CreateClientPopupProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return
    if (initialClient) {
      setName(initialClient.name)
      setEmail(initialClient.email ?? '')
      setPhone(initialClient.phone ?? '')
      setNotes(initialClient.notes ?? '')
    } else {
      setName('')
      setEmail('')
      setPhone('')
      setNotes('')
    }
    setError(null)
    setFieldErrors({})
  }, [isOpen, initialClient])

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = t('clients.nameRequired')
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validate() || !spreadsheetId) return
    setLoading(true)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      }
      if (initialClient) {
        if (onUpdateClient) {
          await onUpdateClient(initialClient.id, payload)
        } else {
          await updateClient(spreadsheetId, initialClient.id, payload)
        }
      } else {
        await createClient(spreadsheetId, payload)
      }
      onSuccess()
      onClose()
      if (!initialClient) {
        setName('')
        setEmail('')
        setPhone('')
        setNotes('')
      }
      setFieldErrors({})
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

  const isEdit = Boolean(initialClient)

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
          {isEdit ? t('clients.editClient') : t('clients.addClient')}
        </h3>
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="client-name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('clients.name')}
            </label>
            <input
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('clients.namePlaceholder')}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="client-email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('clients.email')}
            </label>
            <input
              id="client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label
              htmlFor="client-phone"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('clients.phone')}
            </label>
            <input
              id="client-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label
              htmlFor="client-notes"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {t('clients.notes')}
            </label>
            <input
              id="client-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t('clients.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : isEdit ? t('clients.save') : t('clients.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
