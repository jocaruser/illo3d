import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/services/client/createClient'
import { updateClient } from '@/services/client/updateClient'
import type { Client } from '@/types/money'
import type { UpdateClientPayload } from '@/services/client/updateClient'
import { DialogShell } from './DialogShell'
import { RequiredIndicator } from './RequiredIndicator'

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
  const [preferredContact, setPreferredContact] = useState('')
  const [leadSource, setLeadSource] = useState('')
  const [address, setAddress] = useState('')
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
      setPreferredContact(initialClient.preferred_contact ?? '')
      setLeadSource(initialClient.lead_source ?? '')
      setAddress(initialClient.address ?? '')
    } else {
      setName('')
      setEmail('')
      setPhone('')
      setNotes('')
      setPreferredContact('')
      setLeadSource('')
      setAddress('')
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
        preferred_contact: preferredContact.trim() || undefined,
        lead_source: leadSource.trim() || undefined,
        address: address.trim() || undefined,
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
        setPreferredContact('')
        setLeadSource('')
        setAddress('')
      }
      setFieldErrors({})
    } catch (err) {
      setError(err instanceof Error ? err.message : t('wizard.errorGeneric'))
    } finally {
      setLoading(false)
    }
  }

  const isEdit = Boolean(initialClient)
  const dialogTitle = isEdit ? t('clients.editClient') : t('clients.addClient')

  return (
    <DialogShell isOpen={isOpen} onClose={onClose} title={dialogTitle}>
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="client-name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('clients.name')}
            <RequiredIndicator />
          </label>
          <input
            id="client-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('clients.namePlaceholder')}
            disabled={loading}
            aria-required="true"
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
        <div>
          <label
            htmlFor="client-preferred-contact"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('clients.preferredContact')}
          </label>
          <input
            id="client-preferred-contact"
            type="text"
            value={preferredContact}
            onChange={(e) => setPreferredContact(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
        <div>
          <label
            htmlFor="client-lead-source"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('clients.leadSource')}
          </label>
          <input
            id="client-lead-source"
            type="text"
            value={leadSource}
            onChange={(e) => setLeadSource(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
        <div>
          <label
            htmlFor="client-address"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('clients.address')}
          </label>
          <textarea
            id="client-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
            rows={3}
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
            {loading
              ? t('common.submitting')
              : isEdit
                ? t('clients.save')
                : t('clients.submit')}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
